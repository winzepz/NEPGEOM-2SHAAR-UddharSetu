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
  query: <T extends pg.QueryResultRow = pg.QueryResultRow>(
    text: string,
    params?: unknown[],
  ) => getPool().query<T>(text, params),
}

export async function checkDatabaseConnection() {
  const result = await getPool().query<{ now: Date }>('select now()')

  return result.rows[0]
}

export async function initializeDatabase() {
  await getPool().query(`
    create extension if not exists pgcrypto;

    create table if not exists users (
      id uuid primary key default gen_random_uuid(),
      google_id text not null unique,
      email text not null unique,
      full_name text not null,
      picture text,
      role text not null default 'SOCIAL_WORKER'
        check (role in ('SUPER_ADMIN', 'SOCIAL_WORKER')),
      status text not null default 'PENDING'
        check (status in ('PENDING', 'APPROVED', 'REJECTED')),
      last_login_at timestamptz,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists user_sessions (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null references users(id) on delete cascade,
      token_hash text not null unique,
      expires_at timestamptz not null,
      created_at timestamptz not null default now()
    );

    create index if not exists user_sessions_user_id_idx on user_sessions(user_id);
    create index if not exists user_sessions_expires_at_idx on user_sessions(expires_at);
  `)
}
