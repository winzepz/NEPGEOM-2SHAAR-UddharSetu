import type { KycForm, Page, RequestForm } from '../types/app'

export const initialRequestForm: RequestForm = {
  postType: 'HELP',
  title: '',
  description: '',
  category: 'FOOD',
  urgency: 'MEDIUM',
  latitude: '',
  longitude: '',
  authorityDocumentUrl: '',
  authorityDocumentPublicId: '',
  beneficiaryName: '',
  beneficiaryPhone: '',
  pointOfContactName: '',
  pointOfContactPhone: '',
  localRepresentativeName: '',
  localRepresentativePhone: '',
  targetQuantity: '1',
  targetAmount: '',
}

export const initialKycForm: KycForm = {
  legalName: '',
  dateOfBirth: '',
  governmentIdNumber: '',
  photoUrl: '',
  photoPublicId: '',
  phoneNumber: '',
  governmentDocumentUrl: '',
  governmentDocumentPublicId: '',
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
