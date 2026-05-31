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
  googleId?: string
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

export type AuthMode = 'login' | 'signup'
export type Page = 'home' | 'requests' | 'campaigns' | 'worker' | 'kyc' | 'admin' | 'profile'

export type RequestForm = {
  title: string
  description: string
  category: string
  urgency: string
  latitude: string
  longitude: string
  localAuthDocUrl: string
  localAuthDocPublicId: string
  beneficiaryName: string
  beneficiaryPhone: string
  targetQuantity: string
}

export type KycForm = {
  organization: string
  phone: string
  district: string
  documentUrl: string
  documentPublicId: string
  notes: string
}

export type RequestSubmitHandler = (event: FormEvent<HTMLFormElement>) => void
export type FileUploadHandler = (file: File | undefined) => void
