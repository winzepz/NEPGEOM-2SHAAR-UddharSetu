import type { FormEvent } from 'react'

export type HealthResponse = {
  status: string
  service: string
  database?: string
}

export type AuthUser = {
  id: string
  email?: string
  fullName?: string
  picture?: string | null
  googleId?: string | null
  role?: string
  status?: 'PENDING' | 'APPROVED' | 'REJECTED'
}

export type GoogleAuthResponse = {
  user: AuthUser
}

export type HelpRequest = {
  id: string
  title: string
  description: string
  category: string
  urgency: string
  latitude: number
  longitude: number
  localAuthDocUrl: string
  localAuthDocPublicId: string | null
  beneficiaryName: string
  beneficiaryPhone: string
  targetQuantity: number
  fulfilledQuantity: number
  status: string
  reporterName: string
  createdAt: string
}

export type HelpRequestsResponse = {
  helpRequests: HelpRequest[]
}

export type ReliefPost = {
  id: string
  authorId: string
  authorName: string
  postType: 'HELP' | 'FUNDRAISING'
  title: string
  description: string
  category: string
  urgency: string
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
  authorityDocumentUrl: string
  authorityDocumentPublicId: string | null
  reviewStatus: 'PENDING' | 'APPROVED' | 'REJECTED'
  adminNotes: string | null
  createdAt: string
  updatedAt: string
}

export type PostsResponse = {
  posts: ReliefPost[]
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
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  adminNotes: string | null
  createdAt: string
  updatedAt: string
}

export type KycSubmissionsResponse = {
  submissions: KycSubmission[]
}

export type AuthMode = 'login'
export type Page = 'home' | 'requests' | 'campaigns' | 'worker' | 'kyc' | 'admin' | 'profile'

export type RequestForm = {
  postType: 'HELP' | 'FUNDRAISING'
  title: string
  description: string
  category: string
  urgency: string
  latitude: string
  longitude: string
  authorityDocumentUrl: string
  authorityDocumentPublicId: string
  beneficiaryName: string
  beneficiaryPhone: string
  pointOfContactName: string
  pointOfContactPhone: string
  localRepresentativeName: string
  localRepresentativePhone: string
  targetQuantity: string
  targetAmount: string
}

export type KycForm = {
  legalName: string
  dateOfBirth: string
  governmentIdNumber: string
  photoUrl: string
  photoPublicId: string
  phoneNumber: string
  governmentDocumentUrl: string
  governmentDocumentPublicId: string
  notes: string
}

export type RequestSubmitHandler = (event: FormEvent<HTMLFormElement>) => void
export type FileUploadHandler = (file: File | undefined) => void
