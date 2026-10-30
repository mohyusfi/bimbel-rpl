import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, isSupabaseConfigured } from '~/lib/supabase/client'
import { masterDataService, ensureAuthenticatedSession } from '~/server/services/master-data.service'
import { registrationService } from '~/server/services/registration.service'
import { scheduleService } from '~/server/services/schedule.service'
import { attendanceService } from '~/server/services/attendance.service'
import { learningService, type UploadMaterialInput, type SaveGradeInput } from '~/server/services/learning.service'
import { billingService } from '~/server/services/billing.service'
import { calculateAttendancePercentage } from '~/lib/attendance-helpers'
import { authStore } from '~/lib/auth-store'
import {
  adminStore,
  type Registration,
  type Student,
  type Tutor,
  type Subject,
  type Room,
  type Course,
  type ClassGroup,
  type Schedule,
  type Invoice,
  type Announcement,
  type AdminNotification,
  type NotificationType,
  type ScheduleCandidate,
  type AttendanceSession,
  type AttendanceEntry,
  type LearningMaterial,
  type GradeRecord,
  type ParentProfile,
  type PackageCode,
  type AttendanceStatus,
  detectScheduleConflicts,
} from '~/lib/admin-store'

export type {
  Registration,
  Student,
  Tutor,
  Subject,
  Room,
  Course,
  ClassGroup,
  Schedule,
  Invoice,
  Announcement,
  AdminNotification,
  NotificationType,
  ScheduleCandidate,
  AttendanceSession,
  AttendanceEntry,
  LearningMaterial,
  GradeRecord,
  ParentProfile,
  PackageCode,
  AttendanceStatus,
}

export const ADMIN_KEYS = {
  all: ['admin'] as const,
  registrations: ['admin', 'registrations'] as const,
  students: ['admin', 'students'] as const,
  tutors: ['admin', 'tutors'] as const,
  subjects: ['admin', 'subjects'] as const,
  rooms: ['admin', 'rooms'] as const,
  courses: ['admin', 'courses'] as const,
  classes: ['admin', 'classes'] as const,
  schedules: ['admin', 'schedules'] as const,
  invoices: ['admin', 'invoices'] as const,
  announcements: ['admin', 'announcements'] as const,
  notifications: ['admin', 'notifications'] as const,
  attendance: ['admin', 'attendance'] as const,
  attendanceSessions: ['admin', 'attendance'] as const,
  materials: ['admin', 'materials'] as const,
  grades: ['admin', 'grades'] as const,
  gradeRecords: ['admin', 'grades'] as const,
  parents: ['admin', 'parents'] as const,
  session: ['admin', 'session'] as const,
}

let adminSyncRefCount = 0
let adminSyncChannel: any = null
let adminStoreUnsub: (() => void) | null = null
const registeredQueryClients = new Set<ReturnType<typeof useQueryClient>>()

export function useAdminDataSync() {
  const queryClient = useQueryClient()

  React.useEffect(() => {
    registeredQueryClients.add(queryClient)
    adminSyncRefCount++

    if (adminSyncRefCount === 1) {
      adminStoreUnsub = adminStore.subscribe(() => {
        for (const qc of registeredQueryClients) {
          try {
            // Invalidate master operational data, tapi kecualikan notifications
            // agar tidak memicu race condition / refetch storm saat pengguna menandai notifikasi dibaca
            qc.invalidateQueries({
              predicate: (query) => {
                const key = query.queryKey
                if (!Array.isArray(key)) return false
                return key[0] === 'admin' && key[1] !== 'notifications'
              },
            })
          } catch {}
        }
      })

      if (typeof window !== 'undefined' && isSupabaseConfigured() && typeof supabase.channel === 'function') {
        try {
          const channels = typeof supabase.getChannels === 'function' ? supabase.getChannels() : []
          const existing = channels.find((ch: any) => ch.topic === 'realtime:public:academic-sync-live')
          if (existing && typeof supabase.removeChannel === 'function') {
            supabase.removeChannel(existing)
          }

          adminSyncChannel = supabase
            .channel('public:academic-sync-live')
            .on(
              'postgres_changes',
              { event: '*', schema: 'public', table: 'materials' },
              () => {
                for (const qc of registeredQueryClients) {
                  try {
                    qc.invalidateQueries({ queryKey: ADMIN_KEYS.materials })
                    qc.invalidateQueries({ queryKey: ADMIN_KEYS.all })
                  } catch {}
                }
              }
            )
            .on(
              'postgres_changes',
              { event: '*', schema: 'public', table: 'grades' },
              () => {
                for (const qc of registeredQueryClients) {
                  try {
                    qc.invalidateQueries({ queryKey: ADMIN_KEYS.grades })
                    qc.invalidateQueries({ queryKey: ADMIN_KEYS.all })
                  } catch {}
                }
              }
            )
            .subscribe()
        } catch (err) {
          console.warn('[WARN] Gagal menginisialisasi realtime academic sync:', err)
        }
      }
    }

    return () => {
      adminSyncRefCount--
      registeredQueryClients.delete(queryClient)

      if (adminSyncRefCount <= 0) {
        adminSyncRefCount = 0
        if (adminStoreUnsub) {
          adminStoreUnsub()
          adminStoreUnsub = null
        }
        if (adminSyncChannel && typeof supabase.removeChannel === 'function') {
          try {
            supabase.removeChannel(adminSyncChannel)
          } catch {}
          adminSyncChannel = null
        }
      }
    }
  }, [queryClient])
}

export function useAdminRegistrations() {
  useAdminDataSync()
  return useQuery({
    queryKey: ADMIN_KEYS.registrations,
    queryFn: async () => {
      try {
        const dbRegs = await registrationService.getRegistrations()
        return dbRegs || []
      } catch (err) {
        console.warn('[WARN] Gagal mengambil registrations dari Supabase:', err)
        return []
      }
    },
  })
}

export function useAdminStudents() {
  useAdminDataSync()
  return useQuery({
    queryKey: ADMIN_KEYS.students,
    queryFn: async () => {
      try {
        const dbStudents = await registrationService.getStudents()
        return dbStudents || []
      } catch (err) {
        console.warn('[WARN] Gagal mengambil students dari Supabase:', err)
        return []
      }
    },
  })
}

export function useAdminStudentDetail(studentId: string) {
  useAdminDataSync()
  return useQuery({
    queryKey: ['admin', 'student', studentId],
    queryFn: async () => {
      if (!studentId) return null
      try {
        const res = await registrationService.getStudentById(studentId)
        if (res.success && res.data) {
          return res.data
        }
      } catch (err) {
        console.warn('[WARN] Gagal mengambil student detail dari Supabase:', err)
      }
      return null
    },
    enabled: Boolean(studentId),
  })
}

export function useAdminTutors() {
  useAdminDataSync()
  return useQuery({
    queryKey: ADMIN_KEYS.tutors,
    queryFn: async () => {
      try {
        const dbTutors = await masterDataService.getTutors()
        return dbTutors || []
      } catch (err) {
        console.warn('[WARN] Gagal mengambil tutors dari Supabase:', err)
        return []
      }
    },
  })
}

export function useAdminSubjects() {
  useAdminDataSync()
  return useQuery({
    queryKey: ADMIN_KEYS.subjects,
    queryFn: async () => {
      try {
        const tutors = await masterDataService.getTutors()
        const subjectsMap = new Map<string, Subject>()
        for (const t of tutors) {
          if (Array.isArray(t.subjects)) {
            for (const subj of t.subjects) {
              const key = subj.trim()
              if (!key) continue
              const existing = subjectsMap.get(key)
              if (existing) {
                existing.tutorCount = (existing.tutorCount || 1) + 1
              } else {
                subjectsMap.set(key, {
                  id: `sbj-${key.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
                  code: key.toUpperCase().slice(0, 8),
                  name: key,
                  level: 'UTBK' as PackageCode,
                  tutorCount: 1,
                })
              }
            }
          }
        }
        return Array.from(subjectsMap.values())
      } catch (err) {
        console.warn('[WARN] Gagal mengambil subjects dari Supabase:', err)
        return []
      }
    },
  })
}

export function useAdminRooms() {
  useAdminDataSync()
  return useQuery({
    queryKey: ADMIN_KEYS.rooms,
    queryFn: async () => {
      try {
        const dbRooms = await masterDataService.getRooms()
        return dbRooms || []
      } catch (err) {
        console.warn('[WARN] Gagal mengambil rooms dari Supabase:', err)
        return []
      }
    },
  })
}

export function useAdminCourses() {
  useAdminDataSync()
  return useQuery({
    queryKey: ADMIN_KEYS.courses,
    queryFn: async () => {
      try {
        const dbCourses = await masterDataService.getCourses()
        return dbCourses || []
      } catch (err) {
        console.warn('[WARN] Gagal mengambil courses dari Supabase:', err)
        return []
      }
    },
  })
}

export function useAdminClasses() {
  useAdminDataSync()
  return useQuery({
    queryKey: ADMIN_KEYS.classes,
    queryFn: async () => {
      try {
        const dbClasses = await masterDataService.getClasses()
        return dbClasses || []
      } catch (err) {
        console.warn('[WARN] Gagal mengambil classes dari Supabase:', err)
        return []
      }
    },
  })
}

export function useAdminRoom(id?: string) {
  useAdminDataSync()
  return useQuery({
    queryKey: [...ADMIN_KEYS.rooms, id],
    queryFn: async () => {
      if (!id) return null
      try {
        const rooms = await masterDataService.getRooms()
        return rooms.find((r) => r.id === id) || null
      } catch {
        return null
      }
    },
    enabled: Boolean(id),
  })
}

export function useAdminCourse(id?: string) {
  useAdminDataSync()
  return useQuery({
    queryKey: [...ADMIN_KEYS.courses, id],
    queryFn: async () => {
      if (!id) return null
      try {
        const courses = await masterDataService.getCourses()
        return courses.find((c) => c.id === id) || null
      } catch {
        return null
      }
    },
    enabled: Boolean(id),
  })
}

export function useAdminClass(id?: string) {
  useAdminDataSync()
  return useQuery({
    queryKey: [...ADMIN_KEYS.classes, id],
    queryFn: async () => {
      if (!id) return null
      try {
        const classes = await masterDataService.getClasses()
        return classes.find((c) => c.id === id) || null
      } catch {
        return null
      }
    },
    enabled: Boolean(id),
  })
}

export function useAdminTutor(id?: string) {
  useAdminDataSync()
  return useQuery({
    queryKey: [...ADMIN_KEYS.tutors, id],
    queryFn: async () => {
      if (!id) return null
      try {
        const tutors = await masterDataService.getTutors()
        return tutors.find((t) => t.id === id) || null
      } catch {
        return null
      }
    },
    enabled: Boolean(id),
  })
}

// Aliases for convenient and type-safe access
export const useRooms = useAdminRooms
export const useCourses = useAdminCourses
export const useClasses = useAdminClasses
export const useTutors = useAdminTutors
export const useRoom = useAdminRoom
export const useCourse = useAdminCourse
export const useClass = useAdminClass
export const useTutor = useAdminTutor

export function useAdminSchedules() {
  useAdminDataSync()
  return useQuery({
    queryKey: ADMIN_KEYS.schedules,
    queryFn: async () => {
      try {
        const dbSchedules = await scheduleService.getSchedules()
        return (dbSchedules || []) as unknown as Schedule[]
      } catch (err) {
        console.warn('[WARN] Gagal mengambil jadwal dari Supabase:', err)
        return []
      }
    },
  })
}

export function useInvoices(studentId?: string) {
  useAdminDataSync()
  return useQuery({
    queryKey: studentId
      ? ([...ADMIN_KEYS.invoices, 'student', studentId] as const)
      : ADMIN_KEYS.invoices,
    queryFn: async () => {
      try {
        const invoices = await billingService.getInvoices(studentId ? { studentId } : undefined)
        return (invoices || []) as unknown as Invoice[]
      } catch (err) {
        console.warn('[WARN] Gagal mengambil invoice dari Supabase:', err)
        return []
      }
    },
    initialData:
      typeof window === 'undefined'
        ? () => {
            const all = adminStore.getState().invoices
            return studentId ? all.filter((inv) => inv.studentId === studentId) : all
          }
        : undefined,
  })
}

export function useInvoiceDetails(invoiceId?: string) {
  useAdminDataSync()
  return useQuery({
    queryKey: [...ADMIN_KEYS.invoices, 'detail', invoiceId] as const,
    queryFn: async () => {
      if (!invoiceId) return null
      try {
        const inv = await billingService.getInvoiceById(invoiceId)
        if (inv) return inv as unknown as Invoice
      } catch (err) {
        console.warn('[WARN] Gagal mengambil invoice detail dari Supabase:', err)
      }
      return null
    },
    initialData:
      typeof window === 'undefined'
        ? () => {
            if (!invoiceId) return null
            return adminStore.getState().invoices.find((i) => i.id === invoiceId) || null
          }
        : undefined,
    enabled: Boolean(invoiceId),
  })
}

export function useAdminInvoices(studentId?: string) {
  return useInvoices(studentId)
}

export function useAdminAnnouncements(filter?: { targetAudience?: string; role?: string }) {
  useAdminDataSync()
  return useQuery<Announcement[]>({
    queryKey: [...ADMIN_KEYS.announcements, filter?.targetAudience || 'ALL', filter?.role || 'admin'],
    queryFn: async () => {
      try {
        const { getAnnouncementsFn } = await import('~/server/functions/announcements')
        const res = await getAnnouncementsFn({ data: filter })
        if (res.success && res.data) {
          return res.data as Announcement[]
        }
      } catch (err) {
        console.warn('[WARN] Gagal mengambil pengumuman dari server:', err)
      }
      return adminStore.getState().announcements || []
    },
  })
}

export function usePortalAnnouncements(role: 'student' | 'parent' | 'tutor') {
  return useQuery<Announcement[]>({
    queryKey: ['portal-announcements', role],
    queryFn: async () => {
      try {
        const { getAnnouncementsFn } = await import('~/server/functions/announcements')
        const res = await getAnnouncementsFn({ data: { role } })
        if (res.success && res.data) {
          return res.data as Announcement[]
        }
      } catch (err) {
        console.warn('[WARN] Gagal mengambil pengumuman portal dari server:', err)
      }
      const all = adminStore.getState().announcements || []
      return all.filter((a) => {
        if (a.targetAudience === 'Semua') return true
        if (role === 'student' && a.targetAudience === 'Siswa') return true
        if (role === 'parent' && a.targetAudience === 'Orang Tua') return true
        if (role === 'tutor' && a.targetAudience === 'Tutor') return true
        return false
      })
    },
  })
}

export function useAdminNotifications() {
  useAdminDataSync()
  return useQuery({
    queryKey: ADMIN_KEYS.notifications,
    queryFn: async () => {
      try {
        const { data } = await supabase
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50)
        if (data && data.length > 0) {
          return data.map((n: any) => ({
            id: n.id,
            userId: n.user_id,
            title: n.title,
            message: n.message,
            timestamp: n.created_at,
            isRead: Boolean(n.is_read),
            type: n.type || 'general',
            linkUrl: n.link_url,
            metadata: n.metadata,
            createdAt: n.created_at,
          }))
        }
      } catch (err) {
        console.warn('[WARN] Gagal mengambil notifikasi dari Supabase:', err)
      }
      return []
    },
  })
}

export function useAdminSummary() {
  useAdminDataSync()
  const { data: registrations = [], isLoading: isLoadingRegistrations } = useAdminRegistrations()
  const { data: schedules = [], isLoading: isLoadingSchedules } = useAdminSchedules()
  const { data: invoices = [], isLoading: isLoadingInvoices } = useAdminInvoices()
  const { data: rooms = [], isLoading: isLoadingRooms } = useAdminRooms()
  const { data: classes = [], isLoading: isLoadingClasses } = useAdminClasses()

  const isLoading = isLoadingRegistrations || isLoadingSchedules || isLoadingInvoices || isLoadingRooms || isLoadingClasses

  const pendingRegistrationsCount = registrations.filter((r) => r.status === 'menunggu').length
  const pendingInvoicesCount = invoices.filter((i) => i.status === 'menunggu').length

  // Sesi hari ini: Hari ini dimisalkan Senin atau hari aktif
  const todaySchedules = schedules.filter((s) => s.dayOfWeek === 'Senin')

  // Total kapasitas kursi aktif
  const totalCapacity = rooms.filter((r) => r.isActive).reduce((acc, curr) => acc + curr.capacity, 0)
  const totalEnrolled = classes.reduce((acc, curr) => acc + curr.studentCount, 0)
  const occupancyPercentage = totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0

  return {
    pendingRegistrationsCount,
    pendingInvoicesCount,
    todaySchedulesCount: todaySchedules.length,
    todaySchedules,
    totalCapacity,
    totalEnrolled,
    occupancyPercentage,
    isLoading,
  }
}

export type AddLearningMaterialInput = Omit<LearningMaterial, 'id' | 'uploadedAt'> & {
  file?: File | Blob | null
}

export async function uploadAndSaveLearningMaterial(input: AddLearningMaterialInput) {
  const res = await learningService.uploadMaterial({
    file: input.file,
    classId: input.classId,
    tutorId: input.tutorId,
    title: input.title,
    description: input.description,
    category: input.category,
    fileType: input.fileType,
    fileSize: input.fileSize,
    fileUrl: input.fileUrl,
    storagePath: input.storage_path || input.storagePath,
  })

  if (!res.success) {
    throw new Error(res.error)
  }

  return res.data
}

export async function removeAndDeleteLearningMaterial(idOrPayload: string | { id: string; storage_path?: string }) {
  const id = typeof idOrPayload === 'string' ? idOrPayload : idOrPayload.id
  const res = await learningService.deleteMaterial(id)

  if (!res.success) {
    throw new Error(res.error)
  }

  return true
}

export interface SubmitPaymentProofInput {
  invoiceId: string
  file?: File | Blob | null
  fileName?: string
  receiptUrl?: string
  storagePath?: string
  bankName: string
  paymentMethod: string
  submittedByRole: 'student' | 'parent'
  submittedByName: string
}

export async function uploadAndSubmitPaymentProof(input: SubmitPaymentProofInput) {
  let storage_path = input.storagePath
  if (!storage_path && input.file) {
    const originalName = input.fileName || (input.file instanceof File ? input.file.name : 'bukti_transfer.jpg')
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_')
    storage_path = `${input.invoiceId}/${Date.now()}-${sanitizedName}`
  }

  try {
    const result = await billingService.submitPaymentProof({
      ...input,
      storagePath: storage_path,
    })
    if (result.success) {
      return true
    }
  } catch (err) {
    console.warn('[WARN] Supabase submitPaymentProof fallback:', err)
  }

  return adminStore.submitPaymentProof({
    invoiceId: input.invoiceId,
    fileName: input.fileName || 'bukti_transfer.jpg',
    bankName: input.bankName || 'Bank Syariah Indonesia (BSI)',
    paymentMethod: input.paymentMethod || 'Transfer Bank',
    submittedByRole: (input.submittedByRole as 'student' | 'parent') || 'student',
    submittedByName: input.submittedByName || 'Siswa',
    storage_path,
    receiptUrl: input.receiptUrl,
  })
}

// Mutations
export function useAdminMutations() {
  const queryClient = useQueryClient()

  const approveRegistrationMutation = useMutation({
    mutationFn: async ({ regId, classId, reg }: { regId: string; classId: string; reg?: Registration }) => {
      // 1. Eksekusi di database Supabase via service layer
      try {
        const result = await registrationService.approveRegistration(regId, classId)
        if (!result.success) {
          throw new Error(result.error)
        }
      } catch (err: any) {
        console.warn('Supabase approveRegistration fallback / warning:', err?.message)
        // Jika error terkait kapasitas penuh, teruskan error agar UI menampilkan peringatan
        if (err?.message?.includes('sudah penuh') || err?.message?.includes('kapasitas')) {
          throw err
        }
      }
      // 2. Sinkronisasi local store
      return adminStore.approveRegistration(regId, classId, reg)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all })
    },
  })

  const rejectRegistrationMutation = useMutation({
    mutationFn: async ({ regId, reason, reg }: { regId: string; reason: string; reg?: Registration }) => {
      try {
        await registrationService.rejectRegistration(regId, reason)
      } catch (err) {
        console.warn('Supabase rejectRegistration fallback / warning:', err)
      }
      return adminStore.rejectRegistration(regId, reason, reg)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all })
    },
  })

  const addRegistrationMutation = useMutation({
    mutationFn: async (input: Omit<Registration, 'id' | 'createdAt' | 'status'>) => {
      try {
        const res = await registrationService.createRegistration({
          studentName: input.studentName,
          studentEmail: input.studentEmail,
          studentPhone: input.studentPhone,
          studentSchool: input.studentSchool,
          packageCode: input.packageCode,
          packageName: input.packageName,
          parentName: input.parentName,
          parentEmail: input.parentEmail,
          parentPhone: input.parentPhone,
          parentJob: input.parentJob,
          parentAddress: input.parentAddress,
        })
        if (res.success && res.data) {
          return adminStore.addRegistration({
            ...input,
            registrationNumber: res.data.registrationNumber,
          })
        }
      } catch (err) {
        console.warn('Supabase addRegistration fallback / warning:', err)
      }
      return adminStore.addRegistration(input)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all })
    },
  })

  const addStudentMutation = useMutation({
    mutationFn: async (input: Omit<Student, 'id' | 'nis' | 'joinDate' | 'status'>) => {
      const res = await registrationService.createStudent({
        name: input.name,
        email: input.email,
        phone: input.phone,
        school: input.school,
        packageCode: input.packageCode,
        classId: input.classId,
        parentName: input.parentName,
        parentPhone: input.parentPhone,
        parentEmail: input.parentEmail,
        parentJob: input.parentJob,
        parentAddress: input.parentAddress,
      })
      if (!res.success) {
        throw new Error(res.error)
      }
      adminStore.addStudent(input)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all })
    },
  })

  const updateStudentMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Student> }) => {
      const res = await registrationService.updateStudent({
        id,
        name: updates.name || '',
        email: updates.email || '',
        phone: updates.phone || '',
        school: updates.school || '',
        classId: updates.classId || '',
        parentName: updates.parentName || '',
        parentPhone: updates.parentPhone || '',
        parentEmail: updates.parentEmail,
        parentJob: updates.parentJob,
        parentAddress: updates.parentAddress,
        status: (updates.status as 'aktif' | 'nonaktif') || 'aktif',
      })
      if (!res.success) {
        throw new Error(res.error)
      }
      adminStore.updateStudent(id, updates)
      return res.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all })
      queryClient.invalidateQueries({ queryKey: ['admin', 'student', variables.id] })
    },
  })

  const addTutorMutation = useMutation({
    mutationFn: async (input: Omit<Tutor, 'id' | 'weeklySessionsCount' | 'status'>) => {
      return adminStore.addTutor(input)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all })
    },
  })

  const updateTutorMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Tutor> }) => {
      return adminStore.updateTutor(id, updates)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all })
    },
  })

  const addSubjectMutation = useMutation({
    mutationFn: async (input: Omit<Subject, 'id' | 'tutorCount'>) => {
      return adminStore.addSubject(input)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all })
    },
  })

  const addRoomMutation = useMutation({
    mutationFn: async (input: Omit<Room, 'id' | 'isActive'>) => {
      try {
        const res = await masterDataService.createRoom(input)
        if (res.success && res.data) {
          adminStore.addRoom({
            ...input,
            id: res.data.id,
            capacity: res.data.capacity,
          })
          return res.data
        }
      } catch (err) {
        console.warn('Fallback to local store for addRoom:', err)
      }
      return adminStore.addRoom(input)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.rooms })
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all })
    },
  })

  const updateRoomMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Omit<Room, 'id'>> }) => {
      try {
        const res = await masterDataService.updateRoom(id, updates)
        if (res.success && res.data) {
          adminStore.updateRoom(id, updates)
          return res.data
        }
      } catch (err) {
        console.warn('Fallback to local store for updateRoom:', err)
      }
      return adminStore.updateRoom(id, updates)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.rooms })
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all })
    },
  })

  const toggleRoomActiveMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        const res = await masterDataService.toggleRoomActive(id)
        if (res.success && res.data) {
          adminStore.toggleRoomActive(id)
          return res.data
        }
      } catch (err) {
        console.warn('Fallback to local store for toggleRoomActive:', err)
      }
      return adminStore.toggleRoomActive(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.rooms })
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all })
    },
  })

  const updateCourseMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Course> }) => {
      try {
        const res = await masterDataService.updateCourse(id, updates)
        if (res.success && res.data) {
          adminStore.updateCourse(id, updates)
          return res.data
        }
      } catch (err) {
        console.warn('Fallback to local store for updateCourse:', err)
      }
      return adminStore.updateCourse(id, updates)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.courses })
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all })
    },
  })

  const addClassMutation = useMutation({
    mutationFn: async (input: Omit<ClassGroup, 'id' | 'studentCount'>) => {
      return adminStore.addClass(input)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all })
    },
  })

  const updateClassMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Omit<ClassGroup, 'id'>> }) => {
      return adminStore.updateClass(id, updates)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all })
    },
  })

  const plotRegistrationMutation = useMutation({
    mutationFn: async ({ regId, classId }: { regId: string; classId: string }) => {
      return adminStore.approveRegistration(regId, classId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all })
    },
  })

  const plotStudentMutation = useMutation({
    mutationFn: async ({ studentId, classId }: { studentId: string; classId: string }) => {
      return adminStore.assignStudentToClass(studentId, classId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all })
    },
  })

  const addScheduleMutation = useMutation({
    mutationFn: async (input: Omit<Schedule, 'id'>) => {
      try {
        const res = await scheduleService.createSchedule({
          classId: input.classId,
          subjectName: input.subjectName,
          tutorId: input.tutorId,
          roomId: input.roomId,
          dayOfWeek: input.dayOfWeek,
          startTime: input.startTime,
          endTime: input.endTime,
        })
        if (!res.success) {
          if (res.code === 'SCHEDULE_CONFLICT') {
            throw new Error(res.error)
          }
          console.warn('[WARN] Supabase createSchedule warning:', res.error)
        }
      } catch (err: any) {
        if (err?.message?.includes('bentrok') || err?.message?.includes('Bertabrakan') || err?.message?.includes('ruangan')) {
          throw err
        }
        console.warn('[WARN] Supabase createSchedule fallback:', err?.message)
      }
      return adminStore.addSchedule(input)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all })
    },
  })

  const updateScheduleMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Omit<Schedule, 'id'>> }) => {
      try {
        const res = await scheduleService.updateSchedule(id, updates)
        if (!res.success) {
          if (res.code === 'OVERDUE_UPDATE_FORBIDDEN' || res.code === 'SCHEDULE_CONFLICT') {
            throw new Error(res.error)
          }
          console.warn('[WARN] Supabase updateSchedule warning:', res.error)
        }
      } catch (err: any) {
        if (err?.message?.includes('tidak dapat diubah') || err?.message?.includes('bentrok')) {
          throw err
        }
        console.warn('[WARN] Supabase updateSchedule fallback:', err?.message)
      }
      return adminStore.updateSchedule(id, updates)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all })
    },
  })

  const deleteScheduleMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        const res = await scheduleService.deleteSchedule(id)
        if (!res.success) {
          console.warn('[WARN] Supabase deleteSchedule warning:', res.error)
        }
      } catch (err: any) {
        console.warn('[WARN] Supabase deleteSchedule fallback:', err?.message)
      }
      return adminStore.deleteSchedule(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all })
    },
  })

  const createInvoiceMutation = useMutation({
    mutationFn: async (input: {
      studentId: string
      studentName?: string
      nis?: string
      programName: string
      amount: number
      dueDate: string
      description?: string
    }) => {
      const res = await billingService.createInvoice({
        studentId: input.studentId,
        programName: input.programName,
        amount: input.amount,
        dueDate: input.dueDate,
        description: input.description,
      })
      if (!res.success) {
        throw new Error(res.error)
      }
      return res.data
    },
    onSuccess: (data, variables) => {
      adminStore.recordInvoiceNotifications({
        id: data.id,
        studentId: variables.studentId,
        studentName: variables.studentName,
        programName: variables.programName,
        amount: variables.amount,
        dueDate: variables.dueDate,
        invoiceNumber: data.invoiceNumber,
      })
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all })
    },
  })

  const verifyInvoiceMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      const res = await billingService.verifyPayment(invoiceId, {
        verifiedByName: 'Hj. Nuraini, S.Pd',
      })
      if (!res.success) {
        throw new Error(res.error)
      }
      return res.data
    },
    onSuccess: (data, invoiceId) => {
      adminStore.addNotification({
        title: 'Pembayaran SPP Terverifikasi',
        message: `Pembayaran tagihan ${invoiceId} berhasil diverifikasi lunas. Kwitansi: ${data.receiptNumber}.`,
        type: 'billing',
        linkUrl: '/admin/pembayaran',
      })
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all })
    },
  })

  const rejectInvoiceMutation = useMutation({
    mutationFn: async (
      payload:
        | { id: string; reason: string }
        | { invoiceId: string; reason: string }
    ) => {
      const id = 'id' in payload ? payload.id : payload.invoiceId
      const res = await billingService.rejectPayment(id, payload.reason)
      if (!res.success) {
        throw new Error(res.error)
      }
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all })
    },
  })

  const addAnnouncementMutation = useMutation({
    mutationFn: async (
      input: Omit<Announcement, 'id' | 'publishedDate' | 'author'> & {
        broadcast?: boolean
        author?: string
      }
    ) => {
      const { createAnnouncementFn } = await import(
        '~/server/functions/announcements'
      )
      const res = await createAnnouncementFn({
        data: {
          title: input.title,
          content: input.content,
          targetAudience: input.targetAudience,
          isPinned: input.isPinned,
          broadcast: input.broadcast,
          author: input.author,
        },
      })
      if (!res.success) {
        throw new Error(res.error)
      }
      adminStore.addAnnouncement(res.data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all })
      queryClient.invalidateQueries({ queryKey: ['portal-announcements'] })
    },
  })

  const deleteAnnouncementMutation = useMutation({
    mutationFn: async (id: string) => {
      const { deleteAnnouncementFn } = await import(
        '~/server/functions/announcements'
      )
      const res = await deleteAnnouncementFn({ data: { announcementId: id } })
      if (!res.success) {
        throw new Error(res.error)
      }
      adminStore.deleteAnnouncement(id)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all })
      queryClient.invalidateQueries({ queryKey: ['portal-announcements'] })
    },
  })

  const togglePinAnnouncementMutation = useMutation({
    mutationFn: async ({ id, isPinned }: { id: string; isPinned: boolean }) => {
      const { togglePinAnnouncementFn } = await import(
        '~/server/functions/announcements'
      )
      const res = await togglePinAnnouncementFn({
        data: { announcementId: id, isPinned },
      })
      if (!res.success) {
        throw new Error(res.error)
      }
      adminStore.togglePinAnnouncement(id, isPinned)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all })
      queryClient.invalidateQueries({ queryKey: ['portal-announcements'] })
    },
  })

  const markAllNotificationsReadMutation = useMutation({
    mutationFn: async () => {
      return adminStore.markAllNotificationsRead()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all })
    },
  })

  const markNotificationReadMutation = useMutation({
    mutationFn: async (id: string) => {
      return adminStore.markNotificationRead(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all })
    },
  })

  const submitPaymentProofMutation = useMutation({
    mutationFn: async (input: SubmitPaymentProofInput) => {
      return uploadAndSubmitPaymentProof(input)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all })
    },
  })

  const saveSessionAttendanceMutation = useMutation({
    mutationFn: async (input: {
      sessionId: string
      topic: string
      entries: AttendanceEntry[]
    }) => {
      // 1. Eksekusi ke database Supabase via service layer
      try {
        const res = await attendanceService.saveSessionAttendance(input)
        if (!res.success) {
          if (res.code === 'SESSION_AUDIT_LOCKED' || res.code === 'DUPLICATE_STUDENT_ENTRY') {
            throw new Error(res.error)
          }
          console.warn('[WARN] Supabase saveSessionAttendance warning:', res.error)
        }
      } catch (err: any) {
        if (err?.message?.includes('Audit Lock') || err?.message?.includes('dikunci') || err?.message?.includes('duplikasi')) {
          throw err
        }
        console.warn('[WARN] Supabase saveSessionAttendance fallback:', err?.message)
      }

      // 2. Sinkronkan ke local reactive store
      return adminStore.saveSessionAttendance(
        input.sessionId,
        input.topic,
        input.entries
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all })
    },
  })

  const createSessionFromScheduleMutation = useMutation({
    mutationFn: async (input: {
      scheduleId: string
      sessionDate: string
      topic?: string
    }) => {
      return adminStore.createSessionFromSchedule(
        input.scheduleId,
        input.sessionDate,
        input.topic
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all })
    },
  })

  const recordStudentAttendanceMutation = useMutation({
    mutationFn: async (input: {
      sessionId: string
      entry: AttendanceEntry
    }) => {
      return adminStore.recordStudentAttendance(input.sessionId, input.entry)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all })
    },
  })

  const addLearningMaterialMutation = useMutation({
    mutationFn: async (input: AddLearningMaterialInput) => {
      return uploadAndSaveLearningMaterial(input)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all })
    },
  })

  const deleteLearningMaterialMutation = useMutation({
    mutationFn: async (idOrPayload: string | { id: string; storage_path?: string }) => {
      return removeAndDeleteLearningMaterial(idOrPayload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all })
    },
  })

  const addGradeRecordMutation = useMutation({
    mutationFn: async (
      input: Omit<GradeRecord, 'id' | 'assessmentDate' | 'classAverage'> & {
        classAverage?: number
        assessmentDate?: string
      }
    ) => {
      const res = await learningService.saveGrade({
        studentId: input.studentId,
        classId: input.classId,
        tutorId: input.tutorId,
        subjectName: input.subjectName,
        assessmentTitle: input.assessmentTitle,
        category: input.category,
        score: input.score,
        tutorFeedback: input.tutorFeedback,
        assessmentDate: input.assessmentDate,
      })
      if (!res.success) {
        throw new Error(res.error)
      }
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.grades })
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all })
    },
  })

  const updateGradeRecordMutation = useMutation({
    mutationFn: async (input: { id: string; updates: Partial<GradeRecord> }) => {
      const res = await learningService.updateGrade(input.id, input.updates)
      if (!res.success) {
        throw new Error(res.error)
      }
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.grades })
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all })
    },
  })

  const setSelectedChildIdMutation = useMutation({
    mutationFn: async (childId: string) => {
      adminStore.setSelectedChildId(childId)
      return childId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all })
    },
  })

  return {
    approveRegistration: approveRegistrationMutation.mutateAsync,
    rejectRegistration: rejectRegistrationMutation.mutateAsync,
    addRegistration: addRegistrationMutation.mutateAsync,
    addStudent: addStudentMutation.mutateAsync,
    updateStudent: updateStudentMutation.mutateAsync,
    addTutor: addTutorMutation.mutateAsync,
    updateTutor: updateTutorMutation.mutateAsync,
    addSubject: addSubjectMutation.mutateAsync,
    addRoom: addRoomMutation.mutateAsync,
    updateRoom: updateRoomMutation.mutateAsync,
    toggleRoomActive: toggleRoomActiveMutation.mutateAsync,
    updateCourse: updateCourseMutation.mutateAsync,
    addClass: addClassMutation.mutateAsync,
    updateClass: updateClassMutation.mutateAsync,
    plotRegistration: plotRegistrationMutation.mutateAsync,
    plotStudent: plotStudentMutation.mutateAsync,
    assignStudentToClass: plotStudentMutation.mutateAsync,
    addSchedule: addScheduleMutation.mutateAsync,
    updateSchedule: updateScheduleMutation.mutateAsync,
    deleteSchedule: deleteScheduleMutation.mutateAsync,
    createInvoice: createInvoiceMutation.mutateAsync,
    verifyInvoice: verifyInvoiceMutation.mutateAsync,
    rejectInvoice: async (
      idOrPayload:
        | string
        | { id: string; reason: string }
        | { invoiceId: string; reason: string },
      maybeReason?: string
    ) => {
      if (typeof idOrPayload === 'string') {
        return rejectInvoiceMutation.mutateAsync({ id: idOrPayload, reason: maybeReason || '' })
      }
      return rejectInvoiceMutation.mutateAsync(idOrPayload)
    },
    submitPaymentProof: submitPaymentProofMutation.mutateAsync,
    saveSessionAttendance: saveSessionAttendanceMutation.mutateAsync,
    createSessionFromSchedule: createSessionFromScheduleMutation.mutateAsync,
    recordStudentAttendance: recordStudentAttendanceMutation.mutateAsync,
    addLearningMaterial: addLearningMaterialMutation.mutateAsync,
    deleteLearningMaterial: deleteLearningMaterialMutation.mutateAsync,
    addGradeRecord: addGradeRecordMutation.mutateAsync,
    updateGradeRecord: updateGradeRecordMutation.mutateAsync,
    setSelectedChildId: setSelectedChildIdMutation.mutateAsync,
    addAnnouncement: addAnnouncementMutation.mutateAsync,
    deleteAnnouncement: deleteAnnouncementMutation.mutateAsync,
    togglePinAnnouncement: togglePinAnnouncementMutation.mutateAsync,
    markAllNotificationsRead: markAllNotificationsReadMutation.mutateAsync,
    markNotificationRead: markNotificationReadMutation.mutateAsync,
    addNotification: adminStore.addNotification.bind(adminStore),
    broadcastAnnouncement: adminStore.broadcastAnnouncement.bind(adminStore),
  }
}

// Standalone Type-Safe Mutation Hooks
export function useAddRoomMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: Omit<Room, 'id' | 'isActive'>) => {
      return adminStore.addRoom(input)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all })
    },
  })
}

export function useUpdateRoomMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Omit<Room, 'id'>> }) => {
      return adminStore.updateRoom(id, updates)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all })
    },
  })
}

export function useUpdateClassMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Omit<ClassGroup, 'id'>> }) => {
      return adminStore.updateClass(id, updates)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all })
    },
  })
}

export function usePlotRegistrationMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ regId, classId }: { regId: string; classId: string }) => {
      try {
        const result = await registrationService.approveRegistration(regId, classId)
        if (!result.success) {
          throw new Error(result.error)
        }
      } catch (err: any) {
        console.warn('Supabase usePlotRegistrationMutation warning:', err?.message)
        if (err?.message?.includes('sudah penuh') || err?.message?.includes('kapasitas')) {
          throw err
        }
      }
      return adminStore.approveRegistration(regId, classId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all })
    },
  })
}

export function usePlotStudentMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ studentId, classId }: { studentId: string; classId: string }) => {
      return adminStore.assignStudentToClass(studentId, classId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all })
    },
  })
}

export function useAddScheduleMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: Omit<Schedule, 'id'>) => {
      try {
        const res = await scheduleService.createSchedule({
          classId: input.classId,
          subjectName: input.subjectName,
          tutorId: input.tutorId,
          roomId: input.roomId,
          dayOfWeek: input.dayOfWeek,
          startTime: input.startTime,
          endTime: input.endTime,
        })
        if (!res.success) {
          if (res.code === 'SCHEDULE_CONFLICT') {
            throw new Error(res.error)
          }
          console.warn('[WARN] Supabase createSchedule warning:', res.error)
        }
      } catch (err: any) {
        if (err?.message?.includes('bentrok') || err?.message?.includes('Bertabrakan') || err?.message?.includes('ruangan')) {
          throw err
        }
        console.warn('[WARN] Supabase createSchedule fallback:', err?.message)
      }
      return adminStore.addSchedule(input)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all })
    },
  })
}

export function useUpdateScheduleMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Omit<Schedule, 'id'>> }) => {
      try {
        const res = await scheduleService.updateSchedule(id, updates)
        if (!res.success) {
          if (res.code === 'OVERDUE_UPDATE_FORBIDDEN' || res.code === 'SCHEDULE_CONFLICT') {
            throw new Error(res.error)
          }
          console.warn('[WARN] Supabase updateSchedule warning:', res.error)
        }
      } catch (err: any) {
        if (err?.message?.includes('tidak dapat diubah') || err?.message?.includes('bentrok')) {
          throw err
        }
        console.warn('[WARN] Supabase updateSchedule fallback:', err?.message)
      }
      return adminStore.updateSchedule(id, updates)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all })
    },
  })
}

export function useSaveSessionAttendanceMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      sessionId: string
      topic: string
      entries: AttendanceEntry[]
    }) => {
      // 1. Eksekusi ke database Supabase via service layer
      try {
        const res = await attendanceService.saveSessionAttendance(input)
        if (!res.success) {
          if (res.code === 'SESSION_AUDIT_LOCKED' || res.code === 'DUPLICATE_STUDENT_ENTRY') {
            throw new Error(res.error)
          }
          console.warn('[WARN] Supabase saveSessionAttendance warning:', res.error)
        }
      } catch (err: any) {
        if (err?.message?.includes('Audit Lock') || err?.message?.includes('dikunci') || err?.message?.includes('duplikasi')) {
          throw err
        }
        console.warn('[WARN] Supabase saveSessionAttendance fallback:', err?.message)
      }

      // 2. Sinkronkan ke local reactive store
      return adminStore.saveSessionAttendance(
        input.sessionId,
        input.topic,
        input.entries
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all })
    },
  })
}

export function useAddLearningMaterialMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: AddLearningMaterialInput) => {
      return uploadAndSaveLearningMaterial(input)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all })
    },
  })
}

export function useDeleteLearningMaterialMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (idOrPayload: string | { id: string; storage_path?: string }) => {
      return removeAndDeleteLearningMaterial(idOrPayload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all })
    },
  })
}

export function useCreateInvoiceMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      studentId: string
      studentName?: string
      nis?: string
      programName: string
      amount: number
      dueDate: string
      description?: string
    }) => {
      const res = await billingService.createInvoice({
        studentId: input.studentId,
        programName: input.programName,
        amount: input.amount,
        dueDate: input.dueDate,
        description: input.description,
      })
      if (!res.success) {
        throw new Error(res.error)
      }
      return res.data
    },
    onSuccess: (data, variables) => {
      adminStore.recordInvoiceNotifications({
        id: data.id,
        studentId: variables.studentId,
        studentName: variables.studentName,
        programName: variables.programName,
        amount: variables.amount,
        dueDate: variables.dueDate,
        invoiceNumber: data.invoiceNumber,
      })
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all })
    },
  })
}

export function useVerifyInvoiceMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (invoiceId: string) => {
      const res = await billingService.verifyPayment(invoiceId, {
        verifiedByName: 'Hj. Nuraini, S.Pd',
      })
      if (!res.success) {
        throw new Error(res.error)
      }
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all })
    },
  })
}

export function useRejectInvoiceMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (
      payload:
        | { id: string; reason: string }
        | { invoiceId: string; reason: string }
    ) => {
      const id = 'id' in payload ? payload.id : payload.invoiceId
      const res = await billingService.rejectPayment(id, payload.reason)
      if (!res.success) {
        throw new Error(res.error)
      }
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all })
    },
  })
}

export function useSubmitPaymentProofMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: SubmitPaymentProofInput) => {
      return uploadAndSubmitPaymentProof(input)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all })
    },
  })
}

// -------------------------------------------------------------
// Specialized Query Hooks for Tutor, Student, and Parent Portals
// -------------------------------------------------------------

export function useAttendanceSessions(tutorId?: string, classId?: string) {
  useAdminDataSync()
  return useQuery<AttendanceSession[]>({
    queryKey: tutorId
      ? ([...ADMIN_KEYS.attendance, 'tutor', tutorId] as const)
      : classId
        ? ([...ADMIN_KEYS.attendance, 'class', classId] as const)
        : ADMIN_KEYS.attendance,
    queryFn: async () => {
      try {
        const dbSessions = await scheduleService.getSessions(tutorId, classId)
        if (Array.isArray(dbSessions)) {
          return dbSessions.map((s) => ({
            id: s.id,
            scheduleId: s.scheduleId || '',
            classId: s.classId,
            className: s.className || 'Rombel Kelas',
            subjectName: s.subjectName || 'Sesi Bimbingan',
            tutorId: s.tutorId || '',
            tutorName: s.tutorName || 'Tutor Bimbel',
            roomId: s.roomId || '',
            roomName: s.roomName || 'Ruang Belajar',
            sessionDate: s.sessionDate,
            dayOfWeek: s.dayOfWeek || 'Senin',
            startTime: s.startTime || '16:00',
            endTime: s.endTime || '17:30',
            topic: s.topic || 'Sesi Bimbingan',
            isCompleted: s.isCompleted,
            completedAt: (s as any).completedAt || (s as any).createdAt || undefined,
            entries: ((s as { entries?: AttendanceEntry[] }).entries || []),
          }))
        }
      } catch (err) {
        console.warn('[WARN] Gagal mengambil sessions dari Supabase:', err)
      }
      return []
    },
  })
}

export function useSessionDetails(sessionId: string) {
  useAdminDataSync()
  return useQuery({
    queryKey: [...ADMIN_KEYS.attendance, 'session', sessionId] as const,
    queryFn: async () => {
      if (!sessionId) return null
      try {
        const dbSessions = await scheduleService.getSessions()
        const found = dbSessions.find((s) => s.id === sessionId)
        if (found) {
          return {
            id: found.id,
            scheduleId: found.scheduleId || '',
            classId: found.classId,
            className: found.className || 'Rombel Kelas',
            subjectName: found.subjectName || 'Sesi Bimbingan',
            tutorId: found.tutorId || '',
            tutorName: found.tutorName || 'Tutor Bimbel',
            roomId: found.roomId || '',
            roomName: found.roomName || 'Ruang Belajar',
            sessionDate: found.sessionDate,
            dayOfWeek: found.dayOfWeek || 'Senin',
            startTime: found.startTime || '16:00',
            endTime: found.endTime || '17:30',
            topic: found.topic || 'Sesi Bimbingan',
            isCompleted: found.isCompleted,
            completedAt: (found as any).completedAt || (found as any).createdAt || undefined,
            entries: ((found as { entries?: AttendanceEntry[] }).entries || []),
          }
        }
      } catch (err) {
        console.warn('[WARN] Gagal mengambil detail sesi dari Supabase:', err)
      }
      return null
    },
    enabled: Boolean(sessionId),
  })
}

export function useLearningMaterials() {
  useAdminDataSync()
  return useQuery({
    queryKey: ADMIN_KEYS.materials,
    queryFn: async () => {
      return await learningService.getMaterials()
    },
  })
}

export function useClassMaterials(classId?: string) {
  useAdminDataSync()
  return useQuery({
    queryKey: classId ? ([...ADMIN_KEYS.materials, 'class', classId] as const) : ADMIN_KEYS.materials,
    queryFn: async () => {
      if (!classId || classId === 'ALL') {
        return await learningService.getMaterials()
      }
      return await learningService.getMaterialsByClass(classId)
    },
    enabled: Boolean(classId),
  })
}

export function useTutorMaterials(tutorId?: string) {
  useAdminDataSync()
  return useQuery({
    queryKey: tutorId ? ([...ADMIN_KEYS.materials, 'tutor', tutorId] as const) : ADMIN_KEYS.materials,
    queryFn: async () => {
      if (!tutorId || tutorId === 'ALL') {
        return await learningService.getMaterials()
      }
      return await learningService.getMaterialsByTutor(tutorId)
    },
    enabled: Boolean(tutorId),
  })
}

export function useGradeRecords(filters?: { studentId?: string; classId?: string; tutorId?: string }) {
  useAdminDataSync()
  const hasFilter = Boolean(filters?.studentId || filters?.classId || filters?.tutorId)
  const queryKey = hasFilter
    ? ([
        ...ADMIN_KEYS.grades,
        ...(filters?.studentId ? ['student', filters.studentId] : []),
        ...(filters?.classId ? ['class', filters.classId] : []),
        ...(filters?.tutorId ? ['tutor', filters.tutorId] : []),
      ] as const)
    : ADMIN_KEYS.grades

  return useQuery({
    queryKey,
    queryFn: async () => {
      return await learningService.getGrades(filters)
    },
  })
}

export function useParents() {
  useAdminDataSync()
  return useQuery<ParentProfile[]>({
    queryKey: ADMIN_KEYS.parents,
    queryFn: async () => {
      try {
        await ensureAuthenticatedSession()
        const { data } = await supabase
          .from('parents')
          .select('id, profile_id, occupation, address, profiles:profile_id(full_name, phone_number, email)')

        const { data: students } = await supabase
          .from('students')
          .select('id, parent_id')

        const parentChildrenMap = new Map<string, string[]>()
        for (const s of (students || [])) {
          if (s.parent_id) {
            const arr = parentChildrenMap.get(s.parent_id) || []
            arr.push(s.id)
            parentChildrenMap.set(s.parent_id, arr)
          }
        }

        if (data && data.length > 0) {
          return data.map((p: any) => ({
            id: p.id,
            name: p.profiles?.full_name || 'Orang Tua',
            email: p.profiles?.email || '',
            phone: p.profiles?.phone_number || '',
            job: p.occupation || 'Wiraswasta',
            address: p.address || 'Kota Palu',
            studentIds: parentChildrenMap.get(p.id) || [],
          }))
        }
      } catch (err) {
        console.warn('[WARN] Gagal mengambil parents dari Supabase:', err)
      }
      return []
    },
  })
}

export const useAdminParents = useParents

export function useActiveSession() {
  useAdminDataSync()
  return useQuery({
    queryKey: ADMIN_KEYS.session,
    queryFn: () => {
      const state = adminStore.getState()
      const auth = authStore.getState()
      const student = state.students.find((s) => s.id === state.activeStudentId) || (auth.studentProfile as any) || null
      const tutor = state.tutors.find((t) => t.id === state.activeTutorId) || null
      const parent = state.parents.find((p) => p.id === state.activeParentId) || (auth.parentProfile as any) || null
      const selectedChild = state.students.find((s) => s.id === state.selectedChildId) || student

      return {
        activeStudentId: state.activeStudentId,
        activeTutorId: state.activeTutorId,
        activeParentId: state.activeParentId,
        selectedChildId: state.selectedChildId,
        student,
        tutor,
        parent,
        selectedChild,
      }
    },
  })
}

export function useStudentDashboardData(targetStudentId?: string) {
  const { data: session } = useActiveSession()
  const { data: students = [], isLoading: isLoadingStudents } = useAdminStudents()
  const auth = authStore.getState()

  const studentId =
    targetStudentId ||
    (auth.user?.email
      ? students.find((s) => s.email.toLowerCase() === auth.user?.email.toLowerCase())?.id
      : null) ||
    session?.activeStudentId ||
    'd992d9fc-6f5b-434f-998b-358e54a754b7'

  const { data: schedules = [], isLoading: isLoadingSchedules } = useAdminSchedules()
  const { data: sessions = [], isLoading: isLoadingSessions } = useAttendanceSessions()
  const { data: materials = [], isLoading: isLoadingMaterials } = useLearningMaterials()
  const { data: grades = [], isLoading: isLoadingGrades } = useGradeRecords()
  const { data: invoices = [], isLoading: isLoadingInvoices } = useAdminInvoices()

  const isLoading =
    isLoadingStudents ||
    isLoadingSchedules ||
    isLoadingSessions ||
    isLoadingMaterials ||
    isLoadingGrades ||
    isLoadingInvoices

  const currentStudent = students.find((s) => s.id === studentId) || students[0]

  // Filtered schedules for student's class
  const classSchedules = schedules.filter((s) => s.classId === currentStudent?.classId)

  // Attendance sessions for student (by class or student entry)
  const studentSessions = sessions.filter(
    (s) =>
      s.classId === currentStudent?.classId ||
      s.entries.some((e) => e.studentId === studentId)
  )

  const completedSessions = studentSessions.filter((s) => s.isCompleted)
  const hadirCount = completedSessions.filter((s) => {
    const entry = s.entries.find((e) => e.studentId === studentId)
    return entry?.status === 'hadir'
  }).length
  const sakitCount = completedSessions.filter((s) => {
    const entry = s.entries.find((e) => e.studentId === studentId)
    return entry?.status === 'sakit'
  }).length
  const izinCount = completedSessions.filter((s) => {
    const entry = s.entries.find((e) => e.studentId === studentId)
    return entry?.status === 'izin'
  }).length
  const alpaCount = completedSessions.filter((s) => {
    const entry = s.entries.find((e) => e.studentId === studentId)
    return entry?.status === 'alpa'
  }).length

  const totalCompleted = hadirCount + sakitCount + izinCount + alpaCount
  const attendanceRate = calculateAttendancePercentage(hadirCount, totalCompleted)

  // Grades for student (cocokkan UUID database dan ID legacy pengguna aktif)
  const studentGrades = grades.filter(
    (g) => g.studentId === studentId || (currentStudent && g.studentId === currentStudent.id)
  )
  const total = studentGrades.length
  const avgScore =
    total > 0
      ? Math.round(
          studentGrades.reduce((sum, g) => sum + g.score, 0) / total
        )
      : 0
  const highestScore =
    total > 0 ? Math.max(...studentGrades.map((g) => g.score)) : 0
  const avgGrade = total > 0 ? avgScore : 0

  // Class materials: ketat per rombel kelas siswa sesuai Acceptance Criteria Tiket 05
  const classMaterials = materials.filter(
    (m) => currentStudent?.classId && m.classId === currentStudent.classId
  )

  // Invoices (cocokkan UUID database dan ID legacy)
  const studentInvoices = invoices.filter(
    (i) =>
      i.studentId === studentId ||
      (currentStudent && i.studentId === currentStudent.id) ||
      (currentStudent && i.studentName === currentStudent.name)
  )

  return {
    student: currentStudent,
    classSchedules,
    sessions: studentSessions,
    attendanceRate,
    totalSessions: studentSessions.length,
    totalCompleted,
    attendedSessions: hadirCount,
    hadirCount,
    sakitCount,
    izinCount,
    alpaCount,
    grades: studentGrades,
    avgGrade,
    avgScore,
    highestScore,
    total,
    totalAssessments: total,
    materials: classMaterials,
    invoices: studentInvoices,
    isLoading,
  }
}

export function useTutorDashboardData(targetTutorId?: string) {
  const { data: tutors = [], isLoading: isLoadingTutors } = useAdminTutors()
  const { data: session } = useActiveSession()
  const auth = authStore.getState()

  // Resolusi ID Pengajar resmi: targetTutorId -> auth user email / profile -> session activeTutorId -> tutors[0]
  const resolvedTutor =
    (targetTutorId ? tutors.find((t) => t.id === targetTutorId) : null) ||
    (auth.user?.email
      ? tutors.find(
          (t) =>
            t.email?.toLowerCase() === auth.user?.email.toLowerCase() ||
            t.name.toLowerCase() === auth.profile?.full_name?.toLowerCase() ||
            (auth.user?.email.includes('dian') && t.name.toLowerCase().includes('dian'))
        )
      : null) ||
    (session?.activeTutorId ? tutors.find((t) => t.id === session.activeTutorId || t.name === (session.tutor as any)?.name) : null) ||
    tutors[0]

  const tutorId = resolvedTutor?.id || targetTutorId || '9383fc09-99fc-423c-ac09-e3f94c26f5e9'

  const { data: schedules = [], isLoading: isLoadingSchedules } = useAdminSchedules()
  const { data: sessions = [], isLoading: isLoadingSessions } = useAttendanceSessions(tutorId)
  const { data: materials = [], isLoading: isLoadingMaterials } = useLearningMaterials()
  const { data: grades = [], isLoading: isLoadingGrades } = useGradeRecords()
  const { data: classes = [], isLoading: isLoadingClasses } = useAdminClasses()
  const { data: students = [], isLoading: isLoadingStudents } = useAdminStudents()

  const isLoading =
    isLoadingTutors ||
    isLoadingSchedules ||
    isLoadingSessions ||
    isLoadingMaterials ||
    isLoadingGrades ||
    isLoadingClasses ||
    isLoadingStudents

  const currentTutor = resolvedTutor || tutors[0]

  const tutorSchedules = schedules.filter((s) => s.tutorId === tutorId)
  const tutorMaterials = materials.filter((m) => m.tutorId === tutorId)

  // Identify classes associated with this tutor (by tutor assignment or schedules)
  const tutorClassIds = new Set([
    ...classes
      .filter((c) => (c as any).tutorId === tutorId || (currentTutor && c.tutorName === currentTutor.name))
      .map((c) => c.id),
    ...schedules.filter((s) => s.tutorId === tutorId).map((s) => s.classId),
  ])
  const tutorGrades = grades.filter(
    (g) => g.tutorId === tutorId || tutorClassIds.has(g.classId)
  )

  return {
    tutor: currentTutor,
    schedules: tutorSchedules,
    sessions,
    materials: tutorMaterials,
    grades: tutorGrades,
    classes,
    students,
    isLoading,
  }
}

export function useParentDashboardData(targetParentId?: string, targetChildId?: string) {
  const { data: session } = useActiveSession()
  const { data: parents = [], isLoading: isLoadingParents } = useParents()
  const { data: allStudents = [], isLoading: isLoadingStudents } = useAdminStudents()
  const auth = authStore.getState()

  const parentId = targetParentId || session?.activeParentId || (auth.user?.role === 'parent' ? auth.user.id : null)
  const currentParent =
    (targetParentId ? parents.find((p) => p.id === targetParentId) : null) ||
    (auth.user?.email
      ? parents.find(
          (p) => p.email.toLowerCase() === auth.user?.email.toLowerCase()
        )
      : null) ||
    (parentId ? parents.find((p) => p.id === parentId) : null) ||
    parents[0]

  const dbMatchedChildren = allStudents.filter(
    (s) =>
      currentParent?.studentIds.includes(s.id) ||
      (currentParent?.email && s.parentEmail?.toLowerCase() === currentParent.email.toLowerCase()) ||
      (Boolean((s as any).parentId) && (s as any).parentId === currentParent?.id)
  )

  const children =
    dbMatchedChildren.length > 0
      ? dbMatchedChildren
      : (auth.children && auth.children.length > 0 ? auth.children : [])

  const selectedChildId =
    targetChildId || session?.selectedChildId || auth.selectedChildId || children[0]?.id || null
  const activeChild = children.find((c) => c.id === selectedChildId) || children[0] || null

  const childData = useStudentDashboardData(activeChild?.id)
  const isLoading = isLoadingParents || isLoadingStudents || childData.isLoading

  return {
    parent: currentParent,
    children,
    selectedChild: activeChild,
    childData,
    isLoading,
  }
}

export const useBimbelMutations = useAdminMutations
export { useRealtimeNotifications, type RealtimeNotificationsOptions } from './use-realtime-notifications'
