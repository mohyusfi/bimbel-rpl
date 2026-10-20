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
  type AttendanceSession,
  type AttendanceEntry,
  type LearningMaterial,
  type GradeRecord,
  type ParentProfile,
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
  attendance: ['admin', 'attendance'] as const,
  materials: ['admin', 'materials'] as const,
  grades: ['admin', 'grades'] as const,
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

  const submitPaymentProofMutation = useMutation({
    mutationFn: async (input: {
      invoiceId: string
      fileName: string
      bankName: string
      paymentMethod: string
      submittedByRole: 'student' | 'parent'
      submittedByName: string
    }) => {
      return adminStore.submitPaymentProof(input)
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

  const addLearningMaterialMutation = useMutation({
    mutationFn: async (input: Omit<LearningMaterial, 'id' | 'uploadedAt'>) => {
      return adminStore.addLearningMaterial(input)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all })
    },
  })

  const deleteLearningMaterialMutation = useMutation({
    mutationFn: async (id: string) => {
      return adminStore.deleteLearningMaterial(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all })
    },
  })

  const addGradeRecordMutation = useMutation({
    mutationFn: async (input: Omit<GradeRecord, 'id' | 'assessmentDate'>) => {
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
    toggleRoomActive: toggleRoomActiveMutation.mutateAsync,
    updateCourse: updateCourseMutation.mutateAsync,
    addClass: addClassMutation.mutateAsync,
    addSchedule: addScheduleMutation.mutateAsync,
    deleteSchedule: deleteScheduleMutation.mutateAsync,
    createInvoice: createInvoiceMutation.mutateAsync,
    verifyInvoice: verifyInvoiceMutation.mutateAsync,
    rejectInvoice: rejectInvoiceMutation.mutateAsync,
    submitPaymentProof: submitPaymentProofMutation.mutateAsync,
    saveSessionAttendance: saveSessionAttendanceMutation.mutateAsync,
    addLearningMaterial: addLearningMaterialMutation.mutateAsync,
    deleteLearningMaterial: deleteLearningMaterialMutation.mutateAsync,
    addGradeRecord: addGradeRecordMutation.mutateAsync,
    updateGradeRecord: updateGradeRecordMutation.mutateAsync,
    setSelectedChildId: setSelectedChildIdMutation.mutateAsync,
    addAnnouncement: addAnnouncementMutation.mutateAsync,
    deleteAnnouncement: deleteAnnouncementMutation.mutateAsync,
    markAllNotificationsRead: markAllNotificationsReadMutation.mutateAsync,
    markNotificationRead: markNotificationReadMutation.mutateAsync,
  }
}

// -------------------------------------------------------------
// Specialized Query Hooks for Tutor, Student, and Parent Portals
// -------------------------------------------------------------

export function useAttendanceSessions() {
  useAdminDataSync()
  return useQuery({
    queryKey: ADMIN_KEYS.attendance,
    queryFn: () => adminStore.getState().attendanceSessions,
    initialData: () => adminStore.getState().attendanceSessions,
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

  // Attendance statistics
  const studentSessions = sessions.filter((s) =>
    s.entries.some((e) => e.studentId === studentId)
  )
  const totalAttended = studentSessions.filter((s) => {
    const entry = s.entries.find((e) => e.studentId === studentId)
    return entry?.status === 'hadir'
  }).length
  const attendanceRate =
    studentSessions.length > 0
      ? Math.round((totalAttended / studentSessions.length) * 100)
      : 96

  // Grades for student
  const studentGrades = grades.filter((g) => g.studentId === studentId)
  const avgGrade =
    studentGrades.length > 0
      ? Math.round(
          studentGrades.reduce((sum, g) => sum + g.score, 0) /
            studentGrades.length
        )
      : 88

  // Class materials
  const classMaterials = materials.filter(
    (m) => m.classId === currentStudent?.classId
  )

  // Invoices
  const studentInvoices = invoices.filter((i) => i.studentId === studentId)

  return {
    student: currentStudent,
    classSchedules,
    sessions: studentSessions,
    attendanceRate,
    totalSessions: studentSessions.length,
    attendedSessions: totalAttended,
    grades: studentGrades,
    avgGrade,
    materials: classMaterials,
    invoices: studentInvoices,
  }
}

export function useTutorDashboardData(targetTutorId?: string) {
  const { data: session } = useActiveSession()
  const tutorId = targetTutorId || session?.activeTutorId || 'tut-1'

  const { data: tutors = [] } = useAdminTutors()
  const { data: schedules = [] } = useAdminSchedules()
  const { data: sessions = [] } = useAttendanceSessions()
  const { data: materials = [] } = useLearningMaterials()
  const { data: grades = [] } = useGradeRecords()
  const { data: classes = [] } = useAdminClasses()
  const { data: students = [] } = useAdminStudents()

  const currentTutor = tutors.find((t) => t.id === tutorId) || tutors[0]

  const tutorSchedules = schedules.filter((s) => s.tutorId === tutorId)
  const tutorSessions = sessions.filter((s) => s.tutorId === tutorId)
  const tutorMaterials = materials.filter((m) => m.tutorId === tutorId)
  const tutorGrades = grades.filter((g) => g.tutorId === tutorId)

  return {
    tutor: currentTutor,
    schedules: tutorSchedules,
    sessions: tutorSessions,
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
