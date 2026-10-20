import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema/index'

const connectionString =
  process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/postgres'

// Supabase Transaction Pooler (port 6543 / Supavisor) requires prepare: false
const client = postgres(connectionString, {
  prepare: false,
})

export const db = drizzle(client, { schema })
export type Database = typeof db

export * from './schema'
