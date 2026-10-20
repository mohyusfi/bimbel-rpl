import { pgTable, uuid, text, integer, timestamp, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { profiles } from './profiles'
import { classes } from './classes'
import { schedules } from './schedules'
import { sessions } from './sessions'
import { materials } from './materials'
import { grades } from './grades'

export const tutors = pgTable(
  'tutors',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    profileId: uuid('profile_id')
      .notNull()
      .unique()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    specialtySubject: text('specialty_subject'),
    educationBackground: text('education_background'),
    weeklySessionsCount: integer('weekly_sessions_count').default(0).notNull(),
    status: text('status').default('aktif').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('tutors_profile_id_idx').on(table.profileId),
    index('tutors_status_idx').on(table.status),
  ]
)

export const tutorsRelations = relations(tutors, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [tutors.profileId],
    references: [profiles.id],
  }),
  classes: many(classes),
  schedules: many(schedules),
  sessions: many(sessions),
  materials: many(materials),
  grades: many(grades),
}))
