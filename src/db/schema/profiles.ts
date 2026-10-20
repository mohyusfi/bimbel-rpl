import { pgTable, uuid, varchar, text, timestamp, index, pgEnum, boolean } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { students } from './students'
import { parents } from './parents'

export const userRoleEnum = pgEnum('user_role', ['admin', 'tutor', 'student', 'parent'])

export const profiles = pgTable(
  'profiles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    fullName: varchar('full_name', { length: 255 }).notNull(),
    role: userRoleEnum('role').notNull(),
    isSuperAdmin: boolean('is_super_admin').default(false).notNull(),
    status: varchar('status', { length: 20 }).default('aktif').notNull(),
    phoneNumber: varchar('phone_number', { length: 50 }),
    avatarUrl: text('avatar_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('profiles_role_idx').on(table.role),
    index('profiles_email_idx').on(table.email),
  ]
)

export const profilesRelations = relations(profiles, ({ one }) => ({
  student: one(students, {
    fields: [profiles.id],
    references: [students.profileId],
  }),
  parent: one(parents, {
    fields: [profiles.id],
    references: [parents.profileId],
  }),
}))
