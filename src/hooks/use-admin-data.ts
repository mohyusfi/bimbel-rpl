import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
  type ScheduleCandidate,
  detectScheduleConflicts,
} from '~/lib/admin-store'

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
    queryFn: () => adminStore.getState().registrations,
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
    queryFn: () => adminStore.getState().tutors,
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
    queryFn: () => adminStore.getState().rooms,
  })
}

export function useAdminCourses() {
  useAdminDataSync()
  return useQuery({
    queryKey: ADMIN_KEYS.courses,
    queryFn: () => adminStore.getState().courses,
  })
}

export function useAdminClasses() {
  useAdminDataSync()
  return useQuery({
    queryKey: ADMIN_KEYS.classes,
    queryFn: () => adminStore.getState().classes,
  })
}

export function useAdminSchedules() {
  useAdminDataSync()
  return useQuery({
    queryKey: ADMIN_KEYS.schedules,
    queryFn: () => adminStore.getState().schedules,
  })
}

export function useAdminInvoices() {
  useAdminDataSync()
  return useQuery({
    queryKey: ADMIN_KEYS.invoices,
    queryFn: () => adminStore.getState().invoices,
  })
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

// Mutations
export function useAdminMutations() {
  const queryClient = useQueryClient()

  const approveRegistrationMutation = useMutation({
    mutationFn: async ({ regId, classId }: { regId: string; classId: string }) => {
      return adminStore.approveRegistration(regId, classId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all })
    },
  })

  const rejectRegistrationMutation = useMutation({
    mutationFn: async ({ regId, reason }: { regId: string; reason: string }) => {
      return adminStore.rejectRegistration(regId, reason)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all })
    },
  })

  const addRegistrationMutation = useMutation({
    mutationFn: async (input: Omit<Registration, 'id' | 'createdAt' | 'status'>) => {
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
      return adminStore.addRoom(input)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all })
    },
  })

  const toggleRoomActiveMutation = useMutation({
    mutationFn: async (id: string) => {
      return adminStore.toggleRoomActive(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all })
    },
  })

  const updateCourseMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Course> }) => {
      return adminStore.updateCourse(id, updates)
    },
    onSuccess: () => {
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

  const addScheduleMutation = useMutation({
    mutationFn: async (input: Omit<Schedule, 'id'>) => {
      return adminStore.addSchedule(input)
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
    mutationFn: async (input: Omit<Invoice, 'id' | 'status'>) => {
      return adminStore.createInvoice(input)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all })
    },
  })

  const verifyInvoiceMutation = useMutation({
    mutationFn: async (id: string) => {
      return adminStore.verifyInvoice(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all })
    },
  })

  const rejectInvoiceMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      return adminStore.rejectInvoice(id, reason)
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
    toggleRoomActive: toggleRoomActiveMutation.mutateAsync,
    updateCourse: updateCourseMutation.mutateAsync,
    addClass: addClassMutation.mutateAsync,
    addSchedule: addScheduleMutation.mutateAsync,
    deleteSchedule: deleteScheduleMutation.mutateAsync,
    createInvoice: createInvoiceMutation.mutateAsync,
    verifyInvoice: verifyInvoiceMutation.mutateAsync,
    rejectInvoice: rejectInvoiceMutation.mutateAsync,
    addAnnouncement: addAnnouncementMutation.mutateAsync,
    deleteAnnouncement: deleteAnnouncementMutation.mutateAsync,
    markAllNotificationsRead: markAllNotificationsReadMutation.mutateAsync,
    markNotificationRead: markNotificationReadMutation.mutateAsync,
  }
}
