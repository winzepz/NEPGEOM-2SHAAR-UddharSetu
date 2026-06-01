import { db } from './db.js'
import {
  parseDate,
  parseOptionalString,
  parseOption,
  parseString,
} from './validation.js'

type KycStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

type KycRow = {
  id: string
  user_id: string
  user_name: string
  user_email: string
  legal_name: string
  date_of_birth: string
  government_id_number: string
  photo_url: string
  photo_public_id: string | null
  phone_number: string
  government_document_url: string
  government_document_public_id: string | null
  status: KycStatus
  admin_notes: string | null
  created_at: Date
  updated_at: Date
}

export type KycSubmission = {
  id: string
  userId: string
  userName: string
  userEmail: string
  legalName: string
  dateOfBirth: string
  governmentIdNumber: string
  photoUrl: string
  photoPublicId: string | null
  phoneNumber: string
  governmentDocumentUrl: string
  governmentDocumentPublicId: string | null
  status: KycStatus
  adminNotes: string | null
  createdAt: string
  updatedAt: string
}

export type KycInput = {
  legalName: string
  dateOfBirth: string
  governmentIdNumber: string
  photoUrl: string
  photoPublicId?: string | null
  phoneNumber: string
  governmentDocumentUrl: string
  governmentDocumentPublicId?: string | null
}

export function parseKycInput(body: unknown): KycInput {
  if (!body || typeof body !== 'object') {
    throw new Error('Request body is required.')
  }

  const data = body as Record<string, unknown>

  return {
    legalName: parseString(data.legalName, 'legalName'),
    dateOfBirth: parseDate(data.dateOfBirth, 'dateOfBirth'),
    governmentIdNumber: parseString(data.governmentIdNumber, 'governmentIdNumber'),
    photoUrl: parseString(data.photoUrl, 'photoUrl'),
    photoPublicId: parseOptionalString(data.photoPublicId),
    phoneNumber: parseString(data.phoneNumber, 'phoneNumber'),
    governmentDocumentUrl: parseString(data.governmentDocumentUrl, 'governmentDocumentUrl'),
    governmentDocumentPublicId: parseOptionalString(data.governmentDocumentPublicId),
  }
}

export function parseReviewInput(body: unknown) {
  if (!body || typeof body !== 'object') {
    throw new Error('Request body is required.')
  }

  const data = body as Record<string, unknown>

  return {
    status: parseOption(data.status, ['APPROVED', 'REJECTED'], 'status'),
    adminNotes: parseOptionalString(data.adminNotes),
  }
}

export async function submitKyc(userId: string, input: KycInput) {
  // Block a second submission while one is already awaiting review.
  const pending = await db.query<{ id: string }>(
    `select id from kyc_submissions where user_id = $1 and status = 'PENDING' limit 1`,
    [userId],
  )
  if (pending.rows[0]) {
    throw new Error('You already have a KYC submission awaiting review.')
  }

  const result = await db.query<KycRow>(
    `
      insert into kyc_submissions (
        user_id,
        legal_name,
        date_of_birth,
        government_id_number,
        photo_url,
        photo_public_id,
        phone_number,
        government_document_url,
        government_document_public_id
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      returning
        id,
        user_id,
        $10::text as user_name,
        $11::text as user_email,
        legal_name,
        date_of_birth::text,
        government_id_number,
        photo_url,
        photo_public_id,
        phone_number,
        government_document_url,
        government_document_public_id,
        status,
        admin_notes,
        created_at,
        updated_at
    `,
    [
      userId,
      input.legalName,
      input.dateOfBirth,
      input.governmentIdNumber,
      input.photoUrl,
      input.photoPublicId ?? null,
      input.phoneNumber,
      input.governmentDocumentUrl,
      input.governmentDocumentPublicId ?? null,
      '',
      '',
    ],
  )

  return toKycSubmission(result.rows[0])
}

export async function listKycSubmissions(status?: KycStatus) {
  const params: unknown[] = []
  const statusFilter = status ? 'where k.status = $1' : ''

  if (status) {
    params.push(status)
  }

  const result = await db.query<KycRow>(
    `
      select
        k.id,
        k.user_id,
        u.full_name as user_name,
        u.email as user_email,
        k.legal_name,
        k.date_of_birth::text,
        k.government_id_number,
        k.photo_url,
        k.photo_public_id,
        k.phone_number,
        k.government_document_url,
        k.government_document_public_id,
        k.status,
        k.admin_notes,
        k.created_at,
        k.updated_at
      from kyc_submissions k
      join users u on u.id = k.user_id
      ${statusFilter}
      order by k.created_at desc
      limit 100
    `,
    params,
  )

  return result.rows.map(toKycSubmission)
}

export async function reviewKycSubmission(id: string, reviewerId: string, status: 'APPROVED' | 'REJECTED', adminNotes: string | null) {
  await db.query('BEGIN')
  try {
    // Only a PENDING submission can be reviewed — prevents flipping an
    // already-decided record (and re-overwriting the user's status).
    const result = await db.query<KycRow>(
      `
        update kyc_submissions
        set status = $2,
            admin_notes = $3,
            reviewed_by = $4,
            reviewed_at = now(),
            updated_at = now()
        where id = $1 and status = 'PENDING'
        returning
          id,
          user_id,
          ''::text as user_name,
          ''::text as user_email,
          legal_name,
          date_of_birth::text,
          government_id_number,
          photo_url,
          photo_public_id,
          phone_number,
          government_document_url,
          government_document_public_id,
          status,
          admin_notes,
          created_at,
          updated_at
      `,
      [id, status, adminNotes, reviewerId],
    )

    const submission = result.rows[0]

    if (!submission) {
      // Either the id doesn't exist or it was already reviewed.
      await db.query('ROLLBACK')
      return null
    }

    await db.query('update users set status = $1, updated_at = now() where id = $2', [
      status,
      submission.user_id,
    ])

    await db.query('COMMIT')
    return toKycSubmission(submission)
  } catch (error) {
    await db.query('ROLLBACK')
    throw error
  }
}

export async function getLatestUserKyc(userId: string) {
  const result = await db.query<KycRow>(
    `
      select
        k.id,
        k.user_id,
        u.full_name as user_name,
        u.email as user_email,
        k.legal_name,
        k.date_of_birth::text,
        k.government_id_number,
        k.photo_url,
        k.photo_public_id,
        k.phone_number,
        k.government_document_url,
        k.government_document_public_id,
        k.status,
        k.admin_notes,
        k.created_at,
        k.updated_at
      from kyc_submissions k
      join users u on u.id = k.user_id
      where k.user_id = $1
      order by k.created_at desc
      limit 1
    `,
    [userId],
  )

  return result.rows[0] ? toKycSubmission(result.rows[0]) : null
}


function toKycSubmission(row: KycRow): KycSubmission {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    userEmail: row.user_email,
    legalName: row.legal_name,
    dateOfBirth: row.date_of_birth,
    governmentIdNumber: row.government_id_number,
    photoUrl: row.photo_url,
    photoPublicId: row.photo_public_id,
    phoneNumber: row.phone_number,
    governmentDocumentUrl: row.government_document_url,
    governmentDocumentPublicId: row.government_document_public_id,
    status: row.status,
    adminNotes: row.admin_notes,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }
}
