import { Clock3, FileCheck2, ShieldCheck, AlertTriangle } from 'lucide-react'
import type { AuthUser, FileUploadHandler, KycForm, RequestSubmitHandler, KycSubmission } from '../types/app'
import { LockedPage } from '../components/LockedPage'
import { PageHeader } from '../components/PageHeader'

type KycPageProps = {
  isUploading: boolean
  kycForm: KycForm
  kycMessage: string
  photoUploadMessage: string
  setKycForm: (form: KycForm) => void
  documentUploadMessage: string
  user: AuthUser | null
  onPhotoUpload: FileUploadHandler
  onDocumentUpload: FileUploadHandler
  onLogin: () => void
  onCampaigns: () => void
  onWorker: () => void
  onSubmit: RequestSubmitHandler
  kycSubmission: KycSubmission | null
  setKycSubmission: (sub: KycSubmission | null) => void
}

export function KycPage({
  isUploading,
  kycForm,
  kycMessage,
  photoUploadMessage,
  setKycForm,
  documentUploadMessage,
  user,
  onPhotoUpload,
  onDocumentUpload,
  onLogin,
  onCampaigns,
  onWorker,
  onSubmit,
  kycSubmission,
  setKycSubmission,
}: KycPageProps) {
  if (!user) {
    return <LockedPage title="KYC" body="Login to prepare your worker verification details." onLogin={onLogin} />
  }

  if (kycSubmission && kycSubmission.status === 'APPROVED') {
    return (
      <section className="content-page narrow-page page-enter">
        <div className="notice-panel success-panel">
          <div className="status-icon">
            <ShieldCheck size={24} />
          </div>
          <strong>Your verification is approved</strong>
          <p>You can now submit verified help requests and fundraising campaigns for review.</p>
          <button className="primary-button" type="button" onClick={onWorker}>
            Create a post
          </button>
        </div>
      </section>
    )
  }

  if (kycSubmission && kycSubmission.status === 'PENDING') {
    return (
      <section className="content-page narrow-page page-enter">
        <div className="notice-panel kyc-receipt">
          <div className="status-icon">
            <Clock3 size={24} />
          </div>
          <strong>KYC pending approval</strong>
          <p>Submitted for: <strong>{kycSubmission.legalName}</strong></p>
          <p>Your verification is waiting for admin approval. Posting will unlock as soon as your account is approved.</p>
          <div className="receipt-links">
            {kycSubmission.photoUrl && (
              <a className="document-link" href={kycSubmission.photoUrl} target="_blank" rel="noreferrer">
                <FileCheck2 size={16} />
                Uploaded profile photo
              </a>
            )}
            {kycSubmission.governmentDocumentUrl && (
              <a className="document-link" href={kycSubmission.governmentDocumentUrl} target="_blank" rel="noreferrer">
                <FileCheck2 size={16} />
                Uploaded government document
              </a>
            )}
          </div>
          <button className="secondary-button" type="button" onClick={onCampaigns}>
            View public campaigns
          </button>
        </div>
      </section>
    )
  }

  if (kycSubmission && kycSubmission.status === 'REJECTED') {
    return (
      <section className="content-page narrow-page page-enter">
        <div className="notice-panel notice-panel--danger">
          <div className="status-icon status-icon--danger">
            <AlertTriangle size={24} />
          </div>
          <strong className="notice-title--danger">Verification needs attention</strong>
          <p>Your KYC submission was rejected by the administration team.</p>
          {kycSubmission.adminNotes && (
            <div className="admin-feedback">
              <strong>Admin feedback</strong>
              <p>{kycSubmission.adminNotes}</p>
            </div>
          )}
          <button className="primary-button" type="button" onClick={() => setKycSubmission(null)}>
            Resubmit KYC
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="content-page narrow-page page-enter">
      <PageHeader eyebrow="KYC" title="Worker verification" body="Complete identity verification before creating help requests or fundraising campaigns." />
      <form className="form-panel" onSubmit={onSubmit}>
        <label>
          Legal name
          <input required value={kycForm.legalName} onChange={(event) => setKycForm({ ...kycForm, legalName: event.target.value })} />
        </label>
        <div className="form-grid">
          <label>
            Date of birth
            <input required type="date" value={kycForm.dateOfBirth} onChange={(event) => setKycForm({ ...kycForm, dateOfBirth: event.target.value })} />
          </label>
          <label>
            Government ID number
            <input required value={kycForm.governmentIdNumber} onChange={(event) => setKycForm({ ...kycForm, governmentIdNumber: event.target.value })} />
          </label>
        </div>
        <label>
          Phone number
          <input required value={kycForm.phoneNumber} onChange={(event) => setKycForm({ ...kycForm, phoneNumber: event.target.value })} />
        </label>
        <div className="form-grid">
          <label>
            Profile photo
            <input accept="image/*" disabled={isUploading} required={!kycForm.photoUrl} type="file" onChange={(event) => onPhotoUpload(event.target.files?.[0])} />
            {photoUploadMessage && <span className="inline-status">{photoUploadMessage}</span>}
          </label>
          <label>
            Government document image
            <input accept="image/*,.pdf" disabled={isUploading} required={!kycForm.governmentDocumentUrl} type="file" onChange={(event) => onDocumentUpload(event.target.files?.[0])} />
            {documentUploadMessage && <span className="inline-status">{documentUploadMessage}</span>}
          </label>
        </div>
        {kycForm.photoUrl && (
          <a className="document-link" href={kycForm.photoUrl} target="_blank" rel="noreferrer">
            <FileCheck2 size={16} />
            Uploaded profile photo
          </a>
        )}
        {kycForm.governmentDocumentUrl && (
          <a className="document-link" href={kycForm.governmentDocumentUrl} target="_blank" rel="noreferrer">
            <FileCheck2 size={16} />
            Uploaded government document
          </a>
        )}
        <label>
          Notes
          <textarea rows={4} value={kycForm.notes} onChange={(event) => setKycForm({ ...kycForm, notes: event.target.value })} />
        </label>
        <button className="primary-button" type="submit">
          Submit KYC
        </button>
        {kycMessage && <p className="form-message">{kycMessage}</p>}
      </form>
    </section>
  )
}
