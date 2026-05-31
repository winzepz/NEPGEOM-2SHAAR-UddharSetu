import type { KycForm, Page, RequestForm } from '../types/app'

export const initialRequestForm: RequestForm = {
  title: '',
  description: '',
  category: 'FOOD',
  urgency: 'MEDIUM',
  latitude: '',
  longitude: '',
  localAuthDocUrl: '',
  localAuthDocPublicId: '',
  beneficiaryName: '',
  beneficiaryPhone: '',
  targetQuantity: '1',
}

export const initialKycForm: KycForm = {
  organization: '',
  phone: '',
  district: '',
  documentUrl: '',
  documentPublicId: '',
  notes: '',
}

export const navItems: Array<{ page: Page; label: string }> = [
  { page: 'home', label: 'Home' },
  { page: 'requests', label: 'Requests' },
  { page: 'campaigns', label: 'Campaigns' },
  { page: 'worker', label: 'Worker' },
  { page: 'kyc', label: 'KYC' },
  { page: 'admin', label: 'Admin' },
]
