import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export type UserRole = 'admin' | 'tutor' | 'student' | 'parent'

export interface ProfileRow {
  id: string
  email: string
  full_name: string
  role: UserRole
  is_super_admin?: boolean
  phone_number?: string | null
  created_at: string
  updated_at: string
}

export interface ParentRow {
  id: string
  profile_id: string
  occupation?: string | null
  address?: string | null
  phone_number?: string | null
  created_at: string
}

export interface StudentRow {
  id: string
  profile_id: string
  parent_id?: string | null
  nis: string
  origin_school?: string | null
  grade_level: 'SD' | 'SMP' | 'SMA' | 'UTBK' | 'ALUMNI' | string
  class_id?: string | null
  status: 'aktif' | 'nonaktif'
  created_at: string
}

export interface DatabaseSchema {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow
        Insert: Omit<ProfileRow, 'created_at' | 'updated_at'> & {
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<ProfileRow, 'id'>>
      }
      parents: {
        Row: ParentRow
        Insert: Omit<ParentRow, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Omit<ParentRow, 'id' | 'profile_id'>>
      }
      students: {
        Row: StudentRow
        Insert: Omit<StudentRow, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Omit<StudentRow, 'id' | 'profile_id'>>
      }
    }
  }
}

// Fallback to configured Tadulako Cendekia Supabase instance
const DEFAULT_SUPABASE_URL = 'https://rtamiwffuaxwzyjkocmj.supabase.co'
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0YW1pd2ZmdWF4d3p5amtvY21qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2MTQzNDksImV4cCI6MjEwNzE5MDM0OX0.bOIIpD_R-4lQW_T0MEnBsINYXTpwVjH3ExU9peF8XD0'

const envUrl =
  typeof import.meta !== 'undefined' && import.meta.env
    ? (import.meta.env.VITE_SUPABASE_URL as string | undefined)
    : undefined

const envAnonKey =
  typeof import.meta !== 'undefined' && import.meta.env
    ? (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)
    : undefined

export const supabaseUrl = envUrl || DEFAULT_SUPABASE_URL
export const supabaseAnonKey = envAnonKey || DEFAULT_SUPABASE_ANON_KEY

export function isSupabaseConfigured(): boolean {
  return Boolean(
    supabaseUrl &&
      supabaseAnonKey &&
      !supabaseUrl.includes('your-project-id') &&
      !supabaseAnonKey.includes('your-anon-key')
  )
}

/**
 * Singleton Supabase Browser Client.
 * Configured with auto-refresh and session persistence in browser localStorage.
 */
export const supabase: SupabaseClient<any> = createClient<any>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'tc_bimbel_supabase_auth_token',
    },
  }
)

/**
 * Factory for creating fresh Supabase client instances (e.g., in server functions or isolation)
 */
export function createSupabaseClient(customToken?: string, persistSession: boolean = false) {
  return createClient<any>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession,
      autoRefreshToken: persistSession,
    },
    global: customToken
      ? {
          headers: {
            Authorization: `Bearer ${customToken}`,
          },
        }
      : undefined,
  })
}
