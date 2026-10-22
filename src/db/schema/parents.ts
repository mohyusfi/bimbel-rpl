import { pgTable, uuid, varchar, text, timestamp, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { profiles } from './profiles'
import { students } from './students'

export const parents = pgTable(
  'parents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    profileId: uuid('profile_id')
      .notNull()
      .unique()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    occupation: varchar('occupation', { length: 255 }),
    address: text('address'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('parents_profile_id_idx').on(table.profileId),
  ]
)

export const parentsRelations = relations(parents, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [parents.profileId],
    references: [profiles.id],
  }),
  students: many(students),
}))
