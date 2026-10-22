import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { classes } from './classes'
import { tutors } from './tutors'

export const materials = pgTable(
  'materials',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    classId: uuid('class_id')
      .notNull()
      .references(() => classes.id, { onDelete: 'cascade' }),
    tutorId: uuid('tutor_id').references(() => tutors.id, { onDelete: 'set null' }),
    title: text('title').notNull(),
    description: text('description'),
    category: text('category').default('Modul Teori').notNull(),
    fileType: text('file_type').notNull(),
    fileSize: text('file_size'),
    fileUrl: text('file_url').notNull(),
    storagePath: text('storage_path'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('materials_class_id_idx').on(table.classId),
    index('materials_tutor_id_idx').on(table.tutorId),
    index('materials_category_idx').on(table.category),
    index('materials_created_at_idx').on(table.createdAt),
  ]
)

export const materialsRelations = relations(materials, ({ one }) => ({
  class: one(classes, {
    fields: [materials.classId],
    references: [classes.id],
  }),
  tutor: one(tutors, {
    fields: [materials.tutorId],
    references: [tutors.id],
  }),
}))
