import { db } from './db.js'
import type { User } from './auth.js'

type HelpRequestRow = {
  id: string
  title: string
  description: string
  category: HelpRequest['category']
  urgency: HelpRequest['urgency']
  latitude: number
  longitude: number
  local_auth_doc_url: string
  local_auth_doc_public_id: string | null
  beneficiary_name: string
  beneficiary_phone: string
  target_quantity: number
  fulfilled_quantity: number
  status: HelpRequest['status']
  reporter_id: string
  reporter_name: string
  created_at: Date
  updated_at: Date
}

export type HelpRequest = {
  id: string
  title: string
  description: string
  category: 'FOOD' | 'CLOTHES' | 'VOLUNTEER' | 'MONEY' | 'OTHER'
  urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM'
  latitude: number
  longitude: number
  localAuthDocUrl: string
  localAuthDocPublicId: string | null
  beneficiaryName: string
  beneficiaryPhone: string
  targetQuantity: number
  fulfilledQuantity: number
  status: 'OPEN' | 'PARTIALLY_FULFILLED' | 'FULFILLED'
  reporterId: string
  reporterName: string
  createdAt: string
  updatedAt: string
}

export type CreateHelpRequestInput = {
  title: string
  description: string
  category: HelpRequest['category']
  urgency: HelpRequest['urgency']
  latitude: number
  longitude: number
  localAuthDocUrl: string
  localAuthDocPublicId?: string
  beneficiaryName: string
  beneficiaryPhone: string
  targetQuantity: number
}

const helpRequestFields = `
  hr.id,
  hr.title,
  hr.description,
  hr.category,
  hr.urgency,
  hr.latitude,
  hr.longitude,
  hr.local_auth_doc_url,
  hr.local_auth_doc_public_id,
  hr.beneficiary_name,
  hr.beneficiary_phone,
  hr.target_quantity,
  hr.fulfilled_quantity,
  hr.status,
  hr.reporter_id,
  u.full_name as reporter_name,
  hr.created_at,
  hr.updated_at
`

export async function listOpenHelpRequests() {
  const result = await db.query<HelpRequestRow>(
    `
      select ${helpRequestFields}
      from help_requests hr
      join users u on u.id = hr.reporter_id
      where hr.status in ('OPEN', 'PARTIALLY_FULFILLED')
      order by hr.created_at desc
      limit 50
    `,
  )

  return result.rows.map(toHelpRequest)
}

export async function listUserHelpRequests(userId: string) {
  const result = await db.query<HelpRequestRow>(
    `
      select ${helpRequestFields}
      from help_requests hr
      join users u on u.id = hr.reporter_id
      where hr.reporter_id = $1
      order by hr.created_at desc
      limit 50
    `,
    [userId],
  )

  return result.rows.map(toHelpRequest)
}

export async function createHelpRequest(input: CreateHelpRequestInput, reporter: User) {
  const result = await db.query<HelpRequestRow>(
    `
      insert into help_requests (
        title,
        description,
        category,
        urgency,
        latitude,
        longitude,
        local_auth_doc_url,
        local_auth_doc_public_id,
        beneficiary_name,
        beneficiary_phone,
        target_quantity,
        reporter_id
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      returning
        id,
        title,
        description,
        category,
        urgency,
        latitude,
        longitude,
        local_auth_doc_url,
        local_auth_doc_public_id,
        beneficiary_name,
        beneficiary_phone,
        target_quantity,
        fulfilled_quantity,
        status,
        reporter_id,
        $13::text as reporter_name,
        created_at,
        updated_at
    `,
    [
      input.title,
      input.description,
      input.category,
      input.urgency,
      input.latitude,
      input.longitude,
      input.localAuthDocUrl,
      input.localAuthDocPublicId ?? null,
      input.beneficiaryName,
      input.beneficiaryPhone,
      input.targetQuantity,
      reporter.id,
      reporter.fullName,
    ],
  )

  return toHelpRequest(result.rows[0])
}

export function parseHelpRequestInput(body: unknown): CreateHelpRequestInput {
  if (!body || typeof body !== 'object') {
    throw new Error('Request body is required.')
  }

  const data = body as Record<string, unknown>
  const category = parseOption(data.category, ['FOOD', 'CLOTHES', 'VOLUNTEER', 'MONEY', 'OTHER'])
  const urgency = parseOption(data.urgency, ['CRITICAL', 'HIGH', 'MEDIUM'])

  return {
    title: parseString(data.title, 'title'),
    description: parseString(data.description, 'description'),
    category,
    urgency,
    latitude: parseNumber(data.latitude, 'latitude'),
    longitude: parseNumber(data.longitude, 'longitude'),
    localAuthDocUrl: parseString(data.localAuthDocUrl, 'localAuthDocUrl'),
    localAuthDocPublicId:
      typeof data.localAuthDocPublicId === 'string' && data.localAuthDocPublicId.trim()
        ? data.localAuthDocPublicId.trim()
        : undefined,
    beneficiaryName: parseString(data.beneficiaryName, 'beneficiaryName'),
    beneficiaryPhone: parseString(data.beneficiaryPhone, 'beneficiaryPhone'),
    targetQuantity: parsePositiveInteger(data.targetQuantity, 'targetQuantity'),
  }
}

function toHelpRequest(row: HelpRequestRow): HelpRequest {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    urgency: row.urgency,
    latitude: row.latitude,
    longitude: row.longitude,
    localAuthDocUrl: row.local_auth_doc_url,
    localAuthDocPublicId: row.local_auth_doc_public_id,
    beneficiaryName: row.beneficiary_name,
    beneficiaryPhone: row.beneficiary_phone,
    targetQuantity: row.target_quantity,
    fulfilledQuantity: row.fulfilled_quantity,
    status: row.status,
    reporterId: row.reporter_id,
    reporterName: row.reporter_name,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }
}

function parseString(value: unknown, field: string) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${field} is required.`)
  }

  return value.trim()
}

function parseNumber(value: unknown, field: string) {
  const numberValue = Number(value)

  if (!Number.isFinite(numberValue)) {
    throw new Error(`${field} must be a number.`)
  }

  return numberValue
}

function parsePositiveInteger(value: unknown, field: string) {
  const numberValue = Number(value)

  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    throw new Error(`${field} must be a positive integer.`)
  }

  return numberValue
}

function parseOption<T extends string>(value: unknown, options: readonly T[]) {
  if (typeof value !== 'string' || !options.includes(value as T)) {
    throw new Error(`Invalid option.`)
  }

  return value as T
}
