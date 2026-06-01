import type { User } from './auth.js'
import { db } from './db.js'
import {
  parseNumber,
  parseOption,
  parseOptionalString,
  parsePositiveInteger,
  parsePositiveNumber,
  parseString,
} from './validation.js'

type PostType = 'HELP' | 'FUNDRAISING'
type PostStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
type Category = 'FOOD' | 'CLOTHES' | 'VOLUNTEER' | 'MONEY' | 'MEDICAL' | 'SUPPLY' | 'OTHER'
type Urgency = 'CRITICAL' | 'HIGH' | 'MEDIUM'

const helpCategories = ['FOOD', 'CLOTHES', 'VOLUNTEER', 'OTHER'] as const
const fundraiserCategories = ['MEDICAL', 'SUPPLY', 'OTHER'] as const

type PostRow = {
  id: string
  author_id: string
  author_name: string
  post_type: PostType
  title: string
  description: string
  category: Category
  urgency: Urgency
  latitude: number
  longitude: number
  beneficiary_name: string
  beneficiary_phone: string
  point_of_contact_name: string
  point_of_contact_phone: string
  local_representative_name: string
  local_representative_phone: string
  target_quantity: number | null
  target_amount: string | null
  fulfilled_quantity: number
  fulfilled_amount: string | null
  image_url: string | null
  image_public_id: string | null
  authority_document_url: string
  authority_document_public_id: string | null
  review_status: PostStatus
  admin_notes: string | null
  created_at: Date
  updated_at: Date
}

export type ReliefPost = {
  id: string
  authorId: string
  authorName: string
  postType: PostType
  title: string
  description: string
  category: Category
  urgency: Urgency
  latitude: number
  longitude: number
  beneficiaryName: string
  beneficiaryPhone: string
  pointOfContactName: string
  pointOfContactPhone: string
  localRepresentativeName: string
  localRepresentativePhone: string
  targetQuantity: number | null
  targetAmount: number | null
  fulfilledQuantity: number
  fulfilledAmount: number
  imageUrl: string
  imagePublicId: string | null
  authorityDocumentUrl: string
  authorityDocumentPublicId: string | null
  reviewStatus: PostStatus
  adminNotes: string | null
  createdAt: string
  updatedAt: string
}

export function parsePostInput(body: unknown) {
  if (!body || typeof body !== 'object') {
    throw new Error('Request body is required.')
  }

  const data = body as Record<string, unknown>
  const postType = parseOption(data.postType, ['HELP', 'FUNDRAISING'], 'postType')
  const category =
    postType === 'HELP'
      ? parseOption(data.category, helpCategories, 'category')
      : parseOption(data.category, fundraiserCategories, 'category')

  return {
    postType,
    title: parseString(data.title, 'title'),
    description: parseString(data.description, 'description'),
    category,
    urgency: parseOption(data.urgency, ['CRITICAL', 'HIGH', 'MEDIUM'], 'urgency'),
    latitude: parseNumber(data.latitude, 'latitude'),
    longitude: parseNumber(data.longitude, 'longitude'),
    beneficiaryName: parseString(data.beneficiaryName, 'beneficiaryName'),
    beneficiaryPhone: parseString(data.beneficiaryPhone, 'beneficiaryPhone'),
    pointOfContactName: parseString(data.pointOfContactName, 'pointOfContactName'),
    pointOfContactPhone: parseString(data.pointOfContactPhone, 'pointOfContactPhone'),
    localRepresentativeName: parseString(data.localRepresentativeName, 'localRepresentativeName'),
    localRepresentativePhone: parseString(data.localRepresentativePhone, 'localRepresentativePhone'),
    targetQuantity: postType === 'HELP' ? parsePositiveInteger(data.targetQuantity, 'targetQuantity') : null,
    targetAmount: postType === 'FUNDRAISING' ? parsePositiveNumber(data.targetAmount, 'targetAmount') : null,
    imageUrl: parseString(data.imageUrl, 'imageUrl'),
    imagePublicId: parseOptionalString(data.imagePublicId),
    authorityDocumentUrl: parseString(data.authorityDocumentUrl, 'authorityDocumentUrl'),
    authorityDocumentPublicId: parseOptionalString(data.authorityDocumentPublicId),
  }
}

export async function createReliefPost(input: ReturnType<typeof parsePostInput>, user: User) {
  const result = await db.query<PostRow>(
    `
      insert into relief_posts (
        author_id,
        post_type,
        title,
        description,
        category,
        urgency,
        latitude,
        longitude,
        beneficiary_name,
        beneficiary_phone,
        point_of_contact_name,
        point_of_contact_phone,
        local_representative_name,
        local_representative_phone,
        target_quantity,
        target_amount,
        image_url,
        image_public_id,
        authority_document_url,
        authority_document_public_id
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      returning
        id,
        author_id,
        $21::text as author_name,
        post_type,
        title,
        description,
        category,
        urgency,
        latitude,
        longitude,
        beneficiary_name,
        beneficiary_phone,
        point_of_contact_name,
        point_of_contact_phone,
        local_representative_name,
        local_representative_phone,
        target_quantity,
        target_amount::text,
        fulfilled_quantity,
        fulfilled_amount::text,
        image_url,
        image_public_id,
        authority_document_url,
        authority_document_public_id,
        review_status,
        admin_notes,
        created_at,
        updated_at
    `,
    [
      user.id,
      input.postType,
      input.title,
      input.description,
      input.category,
      input.urgency,
      input.latitude,
      input.longitude,
      input.beneficiaryName,
      input.beneficiaryPhone,
      input.pointOfContactName,
      input.pointOfContactPhone,
      input.localRepresentativeName,
      input.localRepresentativePhone,
      input.targetQuantity,
      input.targetAmount,
      input.imageUrl,
      input.imagePublicId,
      input.authorityDocumentUrl,
      input.authorityDocumentPublicId,
      user.fullName,
    ],
  )

  return toReliefPost(result.rows[0])
}

export async function listPublicPosts() {
  return listPosts("where p.review_status = 'APPROVED'")
}

export async function listUserPosts(userId: string) {
  return listPosts('where p.author_id = $1', [userId])
}

export async function listReviewPosts() {
  return listPosts("where p.review_status = 'PENDING'")
}

export async function reviewPost(id: string, reviewerId: string, status: 'APPROVED' | 'REJECTED', adminNotes: string | null) {
  const result = await db.query<PostRow>(
    `
      update relief_posts
      set review_status = $2,
          admin_notes = $3,
          reviewed_by = $4,
          reviewed_at = now(),
          updated_at = now()
      where id = $1 and review_status = 'PENDING'
      returning
        id,
        author_id,
        ''::text as author_name,
        post_type,
        title,
        description,
        category,
        urgency,
        latitude,
        longitude,
        beneficiary_name,
        beneficiary_phone,
        point_of_contact_name,
        point_of_contact_phone,
        local_representative_name,
        local_representative_phone,
        target_quantity,
        target_amount::text,
        fulfilled_quantity,
        fulfilled_amount::text,
        image_url,
        image_public_id,
        authority_document_url,
        authority_document_public_id,
        review_status,
        admin_notes,
        created_at,
        updated_at
    `,
    [id, status, adminNotes, reviewerId],
  )

  return result.rows[0] ? toReliefPost(result.rows[0]) : null
}

async function listPosts(whereClause: string, params: unknown[] = []) {
  const result = await db.query<PostRow>(
    `
      select
        p.id,
        p.author_id,
        u.full_name as author_name,
        p.post_type,
        p.title,
        p.description,
        p.category,
        p.urgency,
        p.latitude,
        p.longitude,
        p.beneficiary_name,
        p.beneficiary_phone,
        p.point_of_contact_name,
        p.point_of_contact_phone,
        p.local_representative_name,
        p.local_representative_phone,
        p.target_quantity,
        p.target_amount::text,
        p.fulfilled_quantity,
        p.fulfilled_amount::text,
        p.image_url,
        p.image_public_id,
        p.authority_document_url,
        p.authority_document_public_id,
        p.review_status,
        p.admin_notes,
        p.created_at,
        p.updated_at
      from relief_posts p
      join users u on u.id = p.author_id
      ${whereClause}
      order by p.created_at desc
      limit 100
    `,
    params,
  )

  return result.rows.map(toReliefPost)
}

function toReliefPost(row: PostRow): ReliefPost {
  return {
    id: row.id,
    authorId: row.author_id,
    authorName: row.author_name,
    postType: row.post_type,
    title: row.title,
    description: row.description,
    category: row.category,
    urgency: row.urgency,
    latitude: row.latitude,
    longitude: row.longitude,
    beneficiaryName: row.beneficiary_name,
    beneficiaryPhone: row.beneficiary_phone,
    pointOfContactName: row.point_of_contact_name,
    pointOfContactPhone: row.point_of_contact_phone,
    localRepresentativeName: row.local_representative_name,
    localRepresentativePhone: row.local_representative_phone,
    targetQuantity: row.target_quantity,
    targetAmount: row.target_amount ? Number(row.target_amount) : null,
    fulfilledQuantity: row.fulfilled_quantity ?? 0,
    fulfilledAmount: row.fulfilled_amount ? Number(row.fulfilled_amount) : 0,
    imageUrl: row.image_url ?? '',
    imagePublicId: row.image_public_id,
    authorityDocumentUrl: row.authority_document_url,
    authorityDocumentPublicId: row.authority_document_public_id,
    reviewStatus: row.review_status,
    adminNotes: row.admin_notes,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }
}
