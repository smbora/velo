import dns from 'node:dns'
import 'dotenv/config'
import pg from 'pg'
import { Kysely, PostgresDialect } from 'kysely'
import type { Database } from './schema'

dns.setDefaultResultOrder('ipv4first')

let db: Kysely<Database> | undefined

export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL is not set. Add it to velo/.env locally or as a GitHub Actions secret for database-backed E2E tests.',
    )
  }

  if (!db) {
    const dialect = new PostgresDialect({
      pool: new pg.Pool({
        connectionString: process.env.DATABASE_URL,
        max: 10,
      }),
    })

    db = new Kysely<Database>({ dialect })
  }

  return db
}
