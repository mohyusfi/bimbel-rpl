import * as React from 'react'
import {
  authStore,
  type AuthState,
  type AuthUser,
  type UserRole,
  DEMO_ACCOUNTS,
} from '~/lib/auth-store'
import type { ProfileRow } from '~/lib/supabase/client'
import type { Student, ParentProfile } from '~/lib/admin-store'

let isInitialized = false

export function useAuth() {
  const state: AuthState = React.useSyncExternalStore(
    authStore.subscribe,
    authStore.getState,
    authStore.getState
  )

  React.useEffect(() => {
    if (!isInitialized) {
      isInitialized = true
      authStore.ensureInitialized().catch(() => {})
    }
  }, [])

  const role = state.role
  const user = state.user
  const profile = state.profile

  const isAdmin = role === 'admin'
  const isTutor = role === 'tutor'
  const isStudent = role === 'student'
  const isParent = role === 'parent'
  const isSuperAdmin = Boolean(user?.isSuperAdmin)

  // Hitung inisial nama untuk avatar
  const userDisplayName =
    profile?.full_name ||
    user?.fullName ||
    (role ? DEMO_ACCOUNTS[role]?.name : 'Pengguna')

  const userInitials = React.useMemo(() => {
    if (!userDisplayName) return 'TC'
    const parts = userDisplayName
      .replace(/^(Hj\.|Ir\.|Dr\.|Drs\.|Kak)\s+/i, '')
      .trim()
      .split(/\s+/)
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return userDisplayName.slice(0, 2).toUpperCase()
  }, [userDisplayName])

  const userRoleTitle = React.useMemo(() => {
    if (isAdmin) {
      return isSuperAdmin ? 'Pimpinan / Kepala TU' : 'Staf Tata Usaha'
    }
    if (isTutor) return 'Tutor Pengajar'
    if (isStudent) return state.studentProfile?.className || 'Siswa Bimbel'
    if (isParent) return 'Wali Siswa'
    return 'Pengguna Terdaftar'
  }, [isAdmin, isSuperAdmin, isTutor, isStudent, isParent, state.studentProfile?.className])

  const selectedChild = React.useMemo(() => {
    if (!isParent) return null
    return (
      state.children.find((c) => c.id === state.selectedChildId) ||
      state.children[0] ||
      null
    )
  }, [isParent, state.children, state.selectedChildId])

  const login = React.useCallback(
    async (email: string, password: string, explicitRole?: UserRole) => {
      return await authStore.login(email, password, explicitRole)
    },
    []
  )

  const logout = React.useCallback(async () => {
    await authStore.logout()
  }, [])

  const verifyRole = React.useCallback(
    (allowedRoles: UserRole | UserRole[]) => {
      return authStore.verifyRole(allowedRoles)
    },
    []
  )

  const switchRole = React.useCallback(async (targetRole: UserRole) => {
    await authStore.switchRole(targetRole)
  }, [])

  const switchChild = React.useCallback((childId: string) => {
    authStore.switchSelectedChild(childId)
  }, [])

  return {
    // State
    user,
    profile,
    role,
    studentProfile: state.studentProfile,
    parentProfile: state.parentProfile,
    children: state.children,
    selectedChild,
    selectedChildId: state.selectedChildId,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,

    // Role checks
    isAdmin,
    isTutor,
    isStudent,
    isParent,
    isSuperAdmin,
    adminStaff: state.adminStaff,

    // Display helpers
    userDisplayName,
    userInitials,
    userRoleTitle,

    // Actions
    login,
    logout,
    verifyRole,
    switchRole,
    switchChild,
    createAdminStaff: authStore.createAdminStaff.bind(authStore),
    updateAdminStaff: authStore.updateAdminStaff.bind(authStore),
    toggleAdminStaffStatus: authStore.toggleAdminStaffStatus.bind(authStore),
  }
}
