import pg from 'pg'

const { Pool } = pg

let pool: pg.Pool | undefined

function getPool() {
  if (pool) {
    return pool
  }

  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error('DATABASE_URL is not configured.')
  }

  pool = new Pool({
    connectionString,
  })

  return pool
}

export const db = {
  query: (...args: Parameters<pg.Pool['query']>) => getPool().query(...args),
}

export async function checkDatabaseConnection() {
  const result = await getPool().query<{ now: Date }>('select now()')

  return result.rows[0]
}
