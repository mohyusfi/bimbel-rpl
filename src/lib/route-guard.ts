import { redirect } from '@tanstack/react-router'
import { authStore, type AuthState, type UserRole } from './auth-store'

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

  // 3. Pencekalan Sesi Aktif Staf Nonaktif (Instant Session Revocation)
  if (state.role === 'admin' && state.user?.email) {
    const staffList = authStore.getAdminStaff()
    const currentEmail = state.user.email.toLowerCase()
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
  return ({ location }: { location: { href: string; pathname: string } }) => {
    // Pada saat build-time / SSR prerendering, biarkan lolos
    if (typeof window === 'undefined') {
      return
    }

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
