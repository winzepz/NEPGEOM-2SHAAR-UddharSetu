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
      google_id text unique,
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

    alter table users
      alter column google_id drop not null;

    create table if not exists user_sessions (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null references users(id) on delete cascade,
      token_hash text not null unique,
      expires_at timestamptz not null,
      created_at timestamptz not null default now()
    );

    create index if not exists user_sessions_user_id_idx on user_sessions(user_id);
    create index if not exists user_sessions_expires_at_idx on user_sessions(expires_at);

    create table if not exists help_requests (
      id uuid primary key default gen_random_uuid(),
      title text not null,
      description text not null,
      category text not null
        check (category in ('FOOD', 'CLOTHES', 'VOLUNTEER', 'MONEY', 'OTHER')),
      urgency text not null default 'MEDIUM'
        check (urgency in ('CRITICAL', 'HIGH', 'MEDIUM')),
      latitude double precision not null,
      longitude double precision not null,
      local_auth_doc_url text not null,
      local_auth_doc_public_id text,
      beneficiary_name text not null,
      beneficiary_phone text not null,
      target_quantity integer not null default 1 check (target_quantity > 0),
      fulfilled_quantity integer not null default 0 check (fulfilled_quantity >= 0),
      status text not null default 'OPEN'
        check (status in ('OPEN', 'PARTIALLY_FULFILLED', 'FULFILLED')),
      reporter_id uuid not null references users(id) on delete restrict,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create index if not exists help_requests_status_idx on help_requests(status);
    create index if not exists help_requests_reporter_id_idx on help_requests(reporter_id);

    alter table help_requests
      add column if not exists local_auth_doc_public_id text;

    create table if not exists kyc_submissions (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null references users(id) on delete cascade,
      legal_name text not null,
      date_of_birth date not null,
      government_id_number text not null,
      photo_url text not null,
      photo_public_id text,
      phone_number text not null,
      government_document_url text not null,
      government_document_public_id text,
      status text not null default 'PENDING'
        check (status in ('PENDING', 'APPROVED', 'REJECTED')),
      admin_notes text,
      reviewed_by uuid references users(id) on delete set null,
      reviewed_at timestamptz,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create index if not exists kyc_submissions_user_id_idx on kyc_submissions(user_id);
    create index if not exists kyc_submissions_status_idx on kyc_submissions(status);

    create table if not exists relief_posts (
      id uuid primary key default gen_random_uuid(),
      author_id uuid not null references users(id) on delete restrict,
      post_type text not null check (post_type in ('HELP', 'FUNDRAISING')),
      title text not null,
      description text not null,
      category text not null
        check (category in ('FOOD', 'CLOTHES', 'VOLUNTEER', 'MONEY', 'OTHER')),
      urgency text not null default 'MEDIUM'
        check (urgency in ('CRITICAL', 'HIGH', 'MEDIUM')),
      latitude double precision not null,
      longitude double precision not null,
      beneficiary_name text not null,
      beneficiary_phone text not null,
      point_of_contact_name text not null,
      point_of_contact_phone text not null,
      local_representative_name text not null,
      local_representative_phone text not null,
      target_quantity integer check (target_quantity is null or target_quantity > 0),
      target_amount numeric(12, 2) check (target_amount is null or target_amount > 0),
      authority_document_url text not null,
      authority_document_public_id text,
      review_status text not null default 'PENDING'
        check (review_status in ('PENDING', 'APPROVED', 'REJECTED')),
      admin_notes text,
      reviewed_by uuid references users(id) on delete set null,
      reviewed_at timestamptz,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      constraint relief_posts_type_target_check check (
        (post_type = 'HELP' and target_quantity is not null)
        or (post_type = 'FUNDRAISING' and target_amount is not null)
      )
    );

    create index if not exists relief_posts_author_id_idx on relief_posts(author_id);
    create index if not exists relief_posts_review_status_idx on relief_posts(review_status);
    create index if not exists relief_posts_post_type_idx on relief_posts(post_type);

    alter table relief_posts
      add column if not exists fulfilled_quantity integer not null default 0;

    alter table relief_posts
      add column if not exists fulfilled_amount numeric(12, 2) not null default 0;

    create table if not exists relief_pledges (
      id uuid primary key default gen_random_uuid(),
      post_id uuid not null references relief_posts(id) on delete cascade,
      pledge_type text check (pledge_type in ('FINANCIAL', 'MATERIAL')),
      amount numeric(12, 2) check (amount is null or amount > 0),
      quantity integer check (quantity is null or quantity > 0),
      donor_name text,
      donor_phone text not null,
      secure_token text unique not null,
      status text not null default 'PLEDGED' check (status in ('PLEDGED', 'COMPLETED', 'EXPIRED', 'CANCELLED')),
      hub_name text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create index if not exists relief_pledges_post_id_idx on relief_pledges(post_id);
    create index if not exists relief_pledges_status_idx on relief_pledges(status);
    create index if not exists relief_pledges_secure_token_idx on relief_pledges(secure_token);
  `)
}
