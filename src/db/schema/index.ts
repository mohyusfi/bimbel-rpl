export * from './profiles'
export * from './parents'
export * from './students'
export * from './registrations'
export * from './tutors'
export * from './rooms'
export * from './courses'
export * from './classes'
export * from './class_members'
export * from './schedules'
export * from './sessions'
export * from './attendances'
export * from './materials'
export * from './grades'
export * from './invoices'
export * from './payments'
export * from './notifications'

import type { InferSelectModel, InferInsertModel } from 'drizzle-orm'
import type { profiles } from './profiles'
import type { parents } from './parents'
import type { students } from './students'
import type { registrations } from './registrations'
import type { tutors } from './tutors'
import type { rooms } from './rooms'
import type { courses } from './courses'
import type { classes } from './classes'
import type { classMembers } from './class_members'
import type { schedules } from './schedules'
import type { sessions } from './sessions'
import type { attendances } from './attendances'
import type { materials } from './materials'
import type { grades } from './grades'
import type { invoices } from './invoices'
import type { payments } from './payments'
import type { notifications } from './notifications'

// Inferred TypeScript types for database queries and mutations
export type Profile = InferSelectModel<typeof profiles>
export type NewProfile = InferInsertModel<typeof profiles>

export type Parent = InferSelectModel<typeof parents>
export type NewParent = InferInsertModel<typeof parents>

export type Student = InferSelectModel<typeof students>
export type NewStudent = InferInsertModel<typeof students>

export type Registration = InferSelectModel<typeof registrations>
export type NewRegistration = InferInsertModel<typeof registrations>

export type Tutor = InferSelectModel<typeof tutors>
export type NewTutor = InferInsertModel<typeof tutors>

export type Room = InferSelectModel<typeof rooms>
export type NewRoom = InferInsertModel<typeof rooms>

export type Course = InferSelectModel<typeof courses>
export type NewCourse = InferInsertModel<typeof courses>

export type Class = InferSelectModel<typeof classes>
export type NewClass = InferInsertModel<typeof classes>

export type ClassMember = InferSelectModel<typeof classMembers>
export type NewClassMember = InferInsertModel<typeof classMembers>

export type Schedule = InferSelectModel<typeof schedules>
export type NewSchedule = InferInsertModel<typeof schedules>

export type Session = InferSelectModel<typeof sessions>
export type NewSession = InferInsertModel<typeof sessions>

export type Attendance = InferSelectModel<typeof attendances>
export type NewAttendance = InferInsertModel<typeof attendances>

export type Material = InferSelectModel<typeof materials>
export type NewMaterial = InferInsertModel<typeof materials>

export type Grade = InferSelectModel<typeof grades>
export type NewGrade = InferInsertModel<typeof grades>

export type Invoice = InferSelectModel<typeof invoices>
export type NewInvoice = InferInsertModel<typeof invoices>

export type Payment = InferSelectModel<typeof payments>
export type NewPayment = InferInsertModel<typeof payments>

export type Notification = InferSelectModel<typeof notifications>
export type NewNotification = InferInsertModel<typeof notifications>
