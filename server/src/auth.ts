import crypto from 'node:crypto'
import type { Request, Response } from 'express'
import { db } from './db.js'

const sessionCookieName = 'uddharsetu_session'
const sessionDurationMs = 1000 * 60 * 60 * 24 * 7

export type User = {
  id: string
  googleId: string | null
  email: string
  fullName: string
  picture: string | null
  role: 'SUPER_ADMIN' | 'SOCIAL_WORKER'
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
}

type UserRow = {
  id: string
  google_id: string | null
  email: string
  full_name: string
  picture: string | null
  role: User['role']
  status: User['status']
}

type SessionRow = {
  id: string
  user_id: string
  token_hash: string
  expires_at: Date
}

export function toPublicUser(row: UserRow): User {
  return {
    id: row.id,
    googleId: row.google_id,
    email: row.email,
    fullName: row.full_name,
    picture: row.picture,
    role: row.role,
    status: row.status,
  }
}

export async function upsertGoogleUser(input: {
  googleId: string
  email: string
  fullName: string
  picture?: string
}) {
  const result = await db.query<UserRow>(
    `
      insert into users (google_id, email, full_name, picture, last_login_at)
      values ($1, $2, $3, $4, now())
      on conflict (email)
      do update set
        google_id = excluded.google_id,
        email = excluded.email,
        full_name = excluded.full_name,
        picture = excluded.picture,
        last_login_at = now(),
        updated_at = now()
      returning id, google_id, email, full_name, picture, role, status
    `,
    [input.googleId, input.email, input.fullName, input.picture ?? null],
  )

  return toPublicUser(result.rows[0])
}

export async function createSession(userId: string) {
  const token = crypto.randomBytes(32).toString('base64url')
  const tokenHash = hashSessionToken(token)
  const expiresAt = new Date(Date.now() + sessionDurationMs)

  await db.query<SessionRow>(
    `
      insert into user_sessions (user_id, token_hash, expires_at)
      values ($1, $2, $3)
    `,
    [userId, tokenHash, expiresAt],
  )

  return { token, expiresAt }
}

export function setSessionCookie(response: Response, token: string, expiresAt: Date) {
  response.cookie(sessionCookieName, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    path: '/',
  })
}

export function clearSessionCookie(response: Response) {
  response.clearCookie(sessionCookieName, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  })
}

export async function getSessionUser(request: Request) {
  const token = request.cookies?.[sessionCookieName]

  if (typeof token !== 'string') {
    return null
  }

  const tokenHash = hashSessionToken(token)
  const result = await db.query<UserRow>(
    `
      select u.id, u.google_id, u.email, u.full_name, u.picture, u.role, u.status
      from user_sessions s
      join users u on u.id = s.user_id
      where s.token_hash = $1
        and s.expires_at > now()
      limit 1
    `,
    [tokenHash],
  )

  return result.rows[0] ? toPublicUser(result.rows[0]) : null
}

export async function deleteSession(request: Request) {
  const token = request.cookies?.[sessionCookieName]

  if (typeof token !== 'string') {
    return
  }

  await db.query('delete from user_sessions where token_hash = $1', [hashSessionToken(token)])
}

function hashSessionToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex')
}
