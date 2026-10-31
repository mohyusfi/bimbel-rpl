import { redirect } from '@tanstack/react-router'
import { authStore, type AuthState, type UserRole } from './auth-store'
import { adminStore } from './admin-store'

export interface RouteAccessResult {
  allowed: boolean
  redirectTo?: string
  reason?: string
  shouldClearSession?: boolean
}

/**
 * Validasi hak akses rute berdasarkan autentikasi dan peran (RBAC).
 */
export function validateRouteAccess(
  targetPath: string,
  currentAuthState?: AuthState,
  expectedRole?: UserRole
): RouteAccessResult {
  const state = currentAuthState || authStore.getState()

  // 1. Tentukan peran yang diwajibkan (gunakan expectedRole atau turunkan dari rute)
  let requiredRole: UserRole | null = expectedRole || null
  if (!requiredRole) {
    if (targetPath.startsWith('/admin')) {
      requiredRole = 'admin'
    } else if (targetPath.startsWith('/tutor')) {
      requiredRole = 'tutor'
    } else if (targetPath.startsWith('/student')) {
      requiredRole = 'student'
    } else if (targetPath.startsWith('/parent')) {
      requiredRole = 'parent'
    }
  }

  // Jika bukan rute terproteksi peran, izinkan akses
  if (!requiredRole) {
    return { allowed: true }
  }

  // 2. Cek apakah pengguna terautentikasi
  if (!state.isAuthenticated || !state.role || !state.user) {
    return {
      allowed: false,
      redirectTo: `/masuk?redirect=${encodeURIComponent(targetPath)}`,
      reason: 'Pengguna belum terautentikasi.',
    }
  }

  // 3. Pencekalan Sesi Aktif Pengguna Nonaktif (Instant Session Revocation - Berlaku Semua Peran)
  if (state.user?.email) {
    const currentEmail = state.user.email.toLowerCase().trim()

    // A. Cek Admin Staf
    if (state.role === 'admin') {
      const staffList = authStore.getAdminStaff()
      const matchedStaff = staffList.find(
        (s) => s.email.toLowerCase() === currentEmail
      )

      if (matchedStaff && matchedStaff.status === 'nonaktif') {
        return {
          allowed: false,
          redirectTo: '/masuk?deactivated=true',
          reason: 'Akun staf telah dinonaktifkan oleh Pimpinan Lembaga.',
          shouldClearSession: true,
        }
      }
    }

    // B. Cek Tutor / Pengajar
    if (state.role === 'tutor') {
      const { tutors = [] } = adminStore.getState()
      const matchedTutor = tutors.find(
        (t) => t.email?.toLowerCase().trim() === currentEmail
      )
      if (matchedTutor && matchedTutor.status === 'nonaktif') {
        return {
          allowed: false,
          redirectTo: '/masuk?deactivated=true',
          reason: 'Akun pengajar Anda telah dinonaktifkan oleh pihak bimbingan belajar.',
          shouldClearSession: true,
        }
      }
    }

    // C. Cek Siswa
    if (state.role === 'student') {
      const { students = [] } = adminStore.getState()
      const matchedStudent = students.find(
        (s) =>
          s.email?.toLowerCase().trim() === currentEmail ||
          s.nis?.toLowerCase().trim() === currentEmail
      )
      if (matchedStudent && matchedStudent.status === 'nonaktif') {
        return {
          allowed: false,
          redirectTo: '/masuk?deactivated=true',
          reason: 'Akun siswa Anda telah dinonaktifkan oleh pihak bimbingan belajar.',
          shouldClearSession: true,
        }
      }
    }

    // D. Cek Orang Tua / Wali
    if (state.role === 'parent') {
      const { parents = [] } = adminStore.getState()
      const matchedParent = parents.find(
        (p) => p.email?.toLowerCase().trim() === currentEmail
      )
      if (matchedParent && (matchedParent as any).status === 'nonaktif') {
        return {
          allowed: false,
          redirectTo: '/masuk?deactivated=true',
          reason: 'Akun wali Anda telah dinonaktifkan oleh pihak bimbingan belajar.',
          shouldClearSession: true,
        }
      }
    }

    // E. Cek status pada profil pengguna yang sedang login
    if (state.profile && state.profile.status === 'nonaktif') {
      return {
        allowed: false,
        redirectTo: '/masuk?deactivated=true',
        reason: 'Akun Anda telah dinonaktifkan oleh pihak bimbingan belajar.',
        shouldClearSession: true,
      }
    }
  }

  // 4. Cek kecocokan peran (RBAC isolation)
  if (state.role !== requiredRole) {
    return {
      allowed: false,
      redirectTo: `/${state.role}`,
      reason: `Akses ditolak. Pengguna dengan peran ${state.role} tidak memiliki hak akses ke ${targetPath}.`,
    }
  }

  return { allowed: true }
}

/**
 * TanStack Router beforeLoad Guard Helper
 */
export function createRouteGuard(expectedRole: UserRole) {
  return async ({ location }: { location: { href: string; pathname: string } }) => {
    // Pada saat build-time / SSR prerendering, biarkan lolos
    if (typeof window === 'undefined') {
      return
    }

    // Tunggu pemulihan sesi ter-persist selesai sebelum memutuskan redirect,
    // agar hard refresh tidak salah membuang pengguna ke /masuk.
    await authStore.ensureInitialized()

    // Sinkronkan status keaktifan profil dari Supabase atau store lokal
    await authStore.syncAccountStatus()

    const check = validateRouteAccess(location.pathname, undefined, expectedRole)
    if (!check.allowed && check.redirectTo) {
      if (check.shouldClearSession) {
        authStore.clearSession()
      }
      throw redirect({
        to: check.redirectTo,
      })
    }
  }
}
