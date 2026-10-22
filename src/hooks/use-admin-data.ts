import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '~/lib/supabase/client'
import { masterDataService } from '~/server/services/master-data.service'
import { registrationService } from '~/server/services/registration.service'
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

export function useAdminDataSync() {
  const queryClient = useQueryClient()

  React.useEffect(() => {
    const unsubscribe = adminStore.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all })
    })
    return unsubscribe
  }, [queryClient])
}

export function useAdminRegistrations() {
  useAdminDataSync()
  return useQuery({
    queryKey: ADMIN_KEYS.registrations,
    queryFn: async () => {
      try {
        const dbRegs = await registrationService.getRegistrations()
        if (dbRegs && dbRegs.length > 0) {
          return dbRegs
        }
      } catch (err) {
        console.warn('Fallback to local store for registrations:', err)
      }
      return adminStore.getState().registrations
    },
  })
}

export function useAdminStudents() {
  useAdminDataSync()
  return useQuery({
    queryKey: ADMIN_KEYS.students,
    queryFn: () => adminStore.getState().students,
  })
}

export function useAdminTutors() {
  useAdminDataSync()
  return useQuery({
    queryKey: ADMIN_KEYS.tutors,
    queryFn: async () => {
      try {
        const dbTutors = await masterDataService.getTutors()
        if (dbTutors && dbTutors.length > 0) {
          return dbTutors
        }
      } catch (err) {
        console.warn('Fallback to local store for tutors:', err)
      }
      return adminStore.getState().tutors
    },
    initialData: () => adminStore.getState().tutors,
  })
}

export function useAdminSubjects() {
  useAdminDataSync()
  return useQuery({
    queryKey: ADMIN_KEYS.subjects,
    queryFn: () => adminStore.getState().subjects,
  })
}

export function useAdminRooms() {
  useAdminDataSync()
  return useQuery({
    queryKey: ADMIN_KEYS.rooms,
    queryFn: async () => {
      try {
        const dbRooms = await masterDataService.getRooms()
        if (dbRooms && dbRooms.length > 0) {
          return dbRooms
        }
      } catch (err) {
        console.warn('Fallback to local store for rooms:', err)
      }
      return adminStore.getState().rooms
    },
    initialData: () => adminStore.getState().rooms,
  })
}

export function useAdminCourses() {
  useAdminDataSync()
  return useQuery({
    queryKey: ADMIN_KEYS.courses,
    queryFn: async () => {
      try {
        const dbCourses = await masterDataService.getCourses()
        if (dbCourses && dbCourses.length > 0) {
          return dbCourses
        }
      } catch (err) {
        console.warn('Fallback to local store for courses:', err)
      }
      return adminStore.getState().courses
    },
    initialData: () => adminStore.getState().courses,
  })
}

export function useAdminClasses() {
  useAdminDataSync()
  return useQuery({
    queryKey: ADMIN_KEYS.classes,
    queryFn: async () => {
      try {
        const dbClasses = await masterDataService.getClasses()
        if (dbClasses && dbClasses.length > 0) {
          return dbClasses
        }
      } catch (err) {
        console.warn('Fallback to local store for classes:', err)
      }
      return adminStore.getState().classes
    },
    initialData: () => adminStore.getState().classes,
  })
}

export function useAdminRoom(id?: string) {
  useAdminDataSync()
  return useQuery({
    queryKey: [...ADMIN_KEYS.rooms, id],
    queryFn: () => (id ? adminStore.getState().rooms.find((r) => r.id === id) || null : null),
    enabled: Boolean(id),
  })
}

export function useAdminCourse(id?: string) {
  useAdminDataSync()
  return useQuery({
    queryKey: [...ADMIN_KEYS.courses, id],
    queryFn: () => (id ? adminStore.getState().courses.find((c) => c.id === id) || null : null),
    enabled: Boolean(id),
  })
}

export function useAdminClass(id?: string) {
  useAdminDataSync()
  return useQuery({
    queryKey: [...ADMIN_KEYS.classes, id],
    queryFn: () => (id ? adminStore.getState().classes.find((c) => c.id === id) || null : null),
    enabled: Boolean(id),
  })
}

export function useAdminTutor(id?: string) {
  useAdminDataSync()
  return useQuery({
    queryKey: [...ADMIN_KEYS.tutors, id],
    queryFn: () => (id ? adminStore.getState().tutors.find((t) => t.id === id) || null : null),
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
    queryFn: () => adminStore.getState().schedules,
  })
}

export function useInvoices(studentId?: string) {
  useAdminDataSync()
  return useQuery({
    queryKey: studentId
      ? ([...ADMIN_KEYS.invoices, 'student', studentId] as const)
      : ADMIN_KEYS.invoices,
    queryFn: () => {
      const all = adminStore.getState().invoices
      return studentId ? all.filter((inv) => inv.studentId === studentId) : all
    },
    initialData: () => {
      const all = adminStore.getState().invoices
      return studentId ? all.filter((inv) => inv.studentId === studentId) : all
    },
  })
}

export function useInvoiceDetails(invoiceId?: string) {
  useAdminDataSync()
  return useQuery({
    queryKey: [...ADMIN_KEYS.invoices, 'detail', invoiceId] as const,
    queryFn: () => {
      if (!invoiceId) return null
      return adminStore.getState().invoices.find((inv) => inv.id === invoiceId) || null
    },
    initialData: () => {
      if (!invoiceId) return null
      return adminStore.getState().invoices.find((inv) => inv.id === invoiceId) || null
    },
    enabled: Boolean(invoiceId),
  })
}

export function useAdminInvoices(studentId?: string) {
  return useInvoices(studentId)
}

export function useAdminAnnouncements() {
  useAdminDataSync()
  return useQuery({
    queryKey: ADMIN_KEYS.announcements,
    queryFn: () => adminStore.getState().announcements,
  })
}

export function useAdminNotifications() {
  useAdminDataSync()
  return useQuery({
    queryKey: ADMIN_KEYS.notifications,
    queryFn: () => adminStore.getState().notifications,
  })
}

export function useAdminSummary() {
  useAdminDataSync()
  const { data: registrations = [] } = useAdminRegistrations()
  const { data: schedules = [] } = useAdminSchedules()
  const { data: invoices = [] } = useAdminInvoices()
  const { data: rooms = [] } = useAdminRooms()
  const { data: classes = [] } = useAdminClasses()

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
  }
}

export type AddLearningMaterialInput = Omit<LearningMaterial, 'id' | 'uploadedAt'> & {
  file?: File | Blob | null
}

export async function uploadAndSaveLearningMaterial(input: AddLearningMaterialInput) {
  let fileUrl = input.fileUrl
  let storage_path = input.storage_path || input.storagePath

  if (input.file) {
    const fileObj = input.file
    const originalName = fileObj instanceof File ? fileObj.name : `${input.title}.${input.fileType === 'PPTX' ? 'pptx' : 'pdf'}`
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_')
    const targetPath = `${input.classId || 'general'}/${Date.now()}-${sanitizedName}`

    const contentType =
      fileObj.type ||
      (input.fileType === 'PPTX'
        ? 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        : 'application/pdf')

    const { error: uploadError } = await supabase.storage
      .from('learning-materials')
      .upload(targetPath, fileObj, {
        contentType,
        upsert: true,
      })

    if (uploadError) {
      console.error('Supabase storage upload failed:', uploadError)
      throw uploadError
    }

    const { data: publicUrlData } = supabase.storage
      .from('learning-materials')
      .getPublicUrl(targetPath)

    fileUrl = publicUrlData.publicUrl
    storage_path = targetPath
  }

  const { file: _, ...materialPayload } = input
  return adminStore.addLearningMaterial({
    ...materialPayload,
    fileUrl: fileUrl || materialPayload.fileUrl,
    storage_path,
    storagePath: storage_path,
  })
}

export async function removeAndDeleteLearningMaterial(idOrPayload: string | { id: string; storage_path?: string }) {
  const id = typeof idOrPayload === 'string' ? idOrPayload : idOrPayload.id
  const explicitStoragePath = typeof idOrPayload === 'object' ? idOrPayload.storage_path : undefined

  const target = adminStore.getState().learningMaterials.find((m) => m.id === id)
  const storagePath = explicitStoragePath || target?.storage_path || target?.storagePath

  if (storagePath) {
    try {
      const { error: removeError } = await supabase.storage
        .from('learning-materials')
        .remove([storagePath])
      if (removeError) {
        console.warn('Supabase storage remove warning:', removeError)
      }
    } catch (err) {
      console.warn('Failed to remove file from Supabase storage:', err)
    }
  }

  return adminStore.deleteLearningMaterial(id)
}

export interface SubmitPaymentProofInput {
  invoiceId: string
  file?: File | Blob | null
  fileName?: string
  bankName: string
  paymentMethod: string
  submittedByRole: 'student' | 'parent'
  submittedByName: string
}

export async function uploadAndSubmitPaymentProof(input: SubmitPaymentProofInput) {
  let storage_path: string | undefined
  let receiptUrl: string | undefined

  if (input.file) {
    const fileObj = input.file
    const originalName =
      fileObj instanceof File
        ? fileObj.name
        : input.fileName || 'bukti_transfer.jpg'
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_')
    const targetPath = `${input.invoiceId}/${Date.now()}-${sanitizedName}`
    const contentType = fileObj.type || 'image/jpeg'
    storage_path = targetPath

    try {
      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(targetPath, fileObj, {
          contentType,
          upsert: true,
        })

      if (uploadError) {
        console.warn('Supabase storage receipts upload notice:', uploadError.message)
      } else {
        const { data: signedData } = await supabase.storage
          .from('receipts')
          .createSignedUrl(targetPath, 60 * 60 * 24 * 7)

        if (signedData?.signedUrl) {
          receiptUrl = signedData.signedUrl
        } else {
          const { data: publicData } = supabase.storage
            .from('receipts')
            .getPublicUrl(targetPath)
          receiptUrl = publicData?.publicUrl
        }
      }
    } catch (err) {
      console.warn('Gagal mengunggah ke Supabase storage receipts:', err)
    }

    // Fallback: Read file to data URL / object URL so image is visible locally
    if (!receiptUrl) {
      if (typeof FileReader !== 'undefined' && fileObj instanceof Blob) {
        receiptUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
          reader.onerror = () => resolve(URL.createObjectURL(fileObj))
          reader.readAsDataURL(fileObj)
        })
      } else if (typeof window !== 'undefined' && fileObj instanceof Blob) {
        receiptUrl = URL.createObjectURL(fileObj)
      }
    }
  }

  const fileName =
    input.fileName ||
    (input.file instanceof File ? input.file.name : 'bukti_transfer.jpg')

  return adminStore.submitPaymentProof({
    invoiceId: input.invoiceId,
    fileName,
    bankName: input.bankName,
    paymentMethod: input.paymentMethod,
    submittedByRole: input.submittedByRole,
    submittedByName: input.submittedByName,
    storage_path,
    receiptUrl,
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
      return adminStore.addStudent(input)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all })
    },
  })

  const updateStudentMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Student> }) => {
      return adminStore.updateStudent(id, updates)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all })
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
      return adminStore.addSchedule(input)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all })
    },
  })

  const updateScheduleMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Omit<Schedule, 'id'>> }) => {
      return adminStore.updateSchedule(id, updates)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all })
    },
  })

  const deleteScheduleMutation = useMutation({
    mutationFn: async (id: string) => {
      return adminStore.deleteSchedule(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all })
    },
  })

  const createInvoiceMutation = useMutation({
    mutationFn: async (input: {
      studentId: string
      studentName: string
      nis: string
      programName: string
      amount: number
      dueDate: string
      description?: string
    }) => {
      return adminStore.createInvoice(input)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all })
    },
  })

  const verifyInvoiceMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      return adminStore.verifyInvoice(invoiceId)
    },
    onSuccess: () => {
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
      return adminStore.rejectInvoice(id, payload.reason)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all })
    },
  })

  const addAnnouncementMutation = useMutation({
    mutationFn: async (input: Omit<Announcement, 'id' | 'publishedDate' | 'author'>) => {
      return adminStore.addAnnouncement(input)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all })
    },
  })

  const deleteAnnouncementMutation = useMutation({
    mutationFn: async (id: string) => {
      return adminStore.deleteAnnouncement(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all })
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
      input: Omit<GradeRecord, 'id' | 'assessmentDate' | 'classAverage'> & { classAverage?: number }
    ) => {
      return adminStore.addGradeRecord(input)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all })
    },
  })

  const updateGradeRecordMutation = useMutation({
    mutationFn: async (input: { id: string; updates: Partial<GradeRecord> }) => {
      return adminStore.updateGradeRecord(input.id, input.updates)
    },
    onSuccess: () => {
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
      studentName: string
      nis: string
      programName: string
      amount: number
      dueDate: string
      description?: string
    }) => {
      return adminStore.createInvoice(input)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all })
    },
  })
}

export function useVerifyInvoiceMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (invoiceId: string) => {
      return adminStore.verifyInvoice(invoiceId)
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
      return adminStore.rejectInvoice(id, payload.reason)
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

export function useAttendanceSessions(tutorId?: string) {
  useAdminDataSync()
  return useQuery({
    queryKey: tutorId ? ([...ADMIN_KEYS.attendance, 'tutor', tutorId] as const) : ADMIN_KEYS.attendance,
    queryFn: () => {
      const all = adminStore.getState().attendanceSessions
      return tutorId ? all.filter((s) => s.tutorId === tutorId) : all
    },
    initialData: () => {
      const all = adminStore.getState().attendanceSessions
      return tutorId ? all.filter((s) => s.tutorId === tutorId) : all
    },
  })
}

export function useSessionDetails(sessionId: string) {
  useAdminDataSync()
  return useQuery({
    queryKey: [...ADMIN_KEYS.attendance, 'session', sessionId] as const,
    queryFn: () => {
      const all = adminStore.getState().attendanceSessions
      return all.find((s) => s.id === sessionId) || null
    },
    initialData: () => {
      const all = adminStore.getState().attendanceSessions
      return all.find((s) => s.id === sessionId) || null
    },
    enabled: Boolean(sessionId),
  })
}

export function useLearningMaterials() {
  useAdminDataSync()
  return useQuery({
    queryKey: ADMIN_KEYS.materials,
    queryFn: () => adminStore.getState().learningMaterials,
    initialData: () => adminStore.getState().learningMaterials,
  })
}

export function useClassMaterials(classId?: string) {
  useAdminDataSync()
  return useQuery({
    queryKey: classId ? ([...ADMIN_KEYS.materials, 'class', classId] as const) : ADMIN_KEYS.materials,
    queryFn: () => {
      const all = adminStore.getState().learningMaterials
      if (!classId || classId === 'ALL') return all
      return all.filter((m) => m.classId === classId || m.classId === 'ALL')
    },
    initialData: () => {
      const all = adminStore.getState().learningMaterials
      if (!classId || classId === 'ALL') return all
      return all.filter((m) => m.classId === classId || m.classId === 'ALL')
    },
  })
}

export function useTutorMaterials(tutorId?: string) {
  useAdminDataSync()
  return useQuery({
    queryKey: tutorId ? ([...ADMIN_KEYS.materials, 'tutor', tutorId] as const) : ADMIN_KEYS.materials,
    queryFn: () => {
      const all = adminStore.getState().learningMaterials
      if (!tutorId || tutorId === 'ALL') return all
      return all.filter((m) => m.tutorId === tutorId)
    },
    initialData: () => {
      const all = adminStore.getState().learningMaterials
      if (!tutorId || tutorId === 'ALL') return all
      return all.filter((m) => m.tutorId === tutorId)
    },
  })
}

export function useGradeRecords() {
  useAdminDataSync()
  return useQuery({
    queryKey: ADMIN_KEYS.grades,
    queryFn: () => adminStore.getState().gradeRecords,
    initialData: () => adminStore.getState().gradeRecords,
  })
}

export function useParents() {
  useAdminDataSync()
  return useQuery({
    queryKey: ADMIN_KEYS.parents,
    queryFn: () => adminStore.getState().parents,
    initialData: () => adminStore.getState().parents,
  })
}

export function useActiveSession() {
  useAdminDataSync()
  return useQuery({
    queryKey: ADMIN_KEYS.session,
    queryFn: () => {
      const state = adminStore.getState()
      const student = state.students.find((s) => s.id === state.activeStudentId) || state.students[0]
      const tutor = state.tutors.find((t) => t.id === state.activeTutorId) || state.tutors[0]
      const parent = state.parents.find((p) => p.id === state.activeParentId) || state.parents[0]
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
    initialData: () => {
      const state = adminStore.getState()
      const student = state.students.find((s) => s.id === state.activeStudentId) || state.students[0]
      const tutor = state.tutors.find((t) => t.id === state.activeTutorId) || state.tutors[0]
      const parent = state.parents.find((p) => p.id === state.activeParentId) || state.parents[0]
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
  const studentId = targetStudentId || session?.activeStudentId || 'stu-1'

  const { data: students = [] } = useAdminStudents()
  const { data: schedules = [] } = useAdminSchedules()
  const { data: sessions = [] } = useAttendanceSessions()
  const { data: materials = [] } = useLearningMaterials()
  const { data: grades = [] } = useGradeRecords()
  const { data: invoices = [] } = useAdminInvoices()

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

  const totalCompleted = completedSessions.length
  const attendanceRate =
    totalCompleted > 0
      ? Math.round((hadirCount / totalCompleted) * 100)
      : 100

  // Grades for student
  const studentGrades = grades.filter((g) => g.studentId === studentId)
  const total = studentGrades.length
  const avgScore =
    total > 0
      ? Math.round(
          studentGrades.reduce((sum, g) => sum + g.score, 0) / total
        )
      : 0
  const highestScore =
    total > 0 ? Math.max(...studentGrades.map((g) => g.score)) : 0
  const avgGrade = total > 0 ? avgScore : 88

  // Class materials
  const classMaterials = materials.filter(
    (m) => m.classId === currentStudent?.classId || m.classId === 'ALL'
  )

  // Invoices
  const studentInvoices = invoices.filter((i) => i.studentId === studentId)

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
  }
}

export function useTutorDashboardData(targetTutorId?: string) {
  const { data: session } = useActiveSession()
  const tutorId = targetTutorId || session?.activeTutorId || 'tut-1'

  const { data: tutors = [] } = useAdminTutors()
  const { data: schedules = [] } = useAdminSchedules()
  const { data: sessions = [] } = useAttendanceSessions(tutorId)
  const { data: materials = [] } = useLearningMaterials()
  const { data: grades = [] } = useGradeRecords()
  const { data: classes = [] } = useAdminClasses()
  const { data: students = [] } = useAdminStudents()

  const currentTutor = tutors.find((t) => t.id === tutorId) || tutors[0]

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
  }
}

export function useParentDashboardData(targetParentId?: string, targetChildId?: string) {
  const { data: session } = useActiveSession()
  const parentId = targetParentId || session?.activeParentId || 'par-1'

  const { data: parents = [] } = useParents()
  const { data: allStudents = [] } = useAdminStudents()

  const currentParent = parents.find((p) => p.id === parentId) || parents[0]
  const children = allStudents.filter((s) => currentParent?.studentIds.includes(s.id))

  const selectedChildId =
    targetChildId || session?.selectedChildId || children[0]?.id || 'stu-1'
  const activeChild = children.find((c) => c.id === selectedChildId) || children[0]

  const childData = useStudentDashboardData(activeChild?.id)

  return {
    parent: currentParent,
    children,
    selectedChild: activeChild,
    childData,
  }
}

export const useBimbelMutations = useAdminMutations
export { useRealtimeNotifications, type RealtimeNotificationsOptions } from './use-realtime-notifications'
