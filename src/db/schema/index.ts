export * from './profiles'
export * from './parents'
export * from './students'
export * from './registrations'

import type { InferSelectModel, InferInsertModel } from 'drizzle-orm'
import type { profiles } from './profiles'
import type { parents } from './parents'
import type { students } from './students'
import type { registrations } from './registrations'

// Inferred TypeScript types for database queries and mutations
export type Profile = InferSelectModel<typeof profiles>
export type NewProfile = InferInsertModel<typeof profiles>

export type Parent = InferSelectModel<typeof parents>
export type NewParent = InferInsertModel<typeof parents>

export type Student = InferSelectModel<typeof students>
export type NewStudent = InferInsertModel<typeof students>

export type Registration = InferSelectModel<typeof registrations>
export type NewRegistration = InferInsertModel<typeof registrations>
