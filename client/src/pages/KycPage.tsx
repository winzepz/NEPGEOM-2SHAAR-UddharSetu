import { FileCheck2 } from 'lucide-react'
import type { AuthUser, FileUploadHandler, KycForm, RequestSubmitHandler } from '../types/app'
import { LockedPage } from '../components/LockedPage'
import { PageHeader } from '../components/PageHeader'

type KycPageProps = {
  isUploading: boolean
  kycForm: KycForm
  kycMessage: string
  setKycForm: (form: KycForm) => void
  uploadMessage: string
  user: AuthUser | null
  onDocumentUpload: FileUploadHandler
  onLogin: () => void
  onSubmit: RequestSubmitHandler
}

export function KycPage({
  isUploading,
  kycForm,
  kycMessage,
  setKycForm,
  uploadMessage,
  user,
  onDocumentUpload,
  onLogin,
  onSubmit,
}: KycPageProps) {
  if (!user) {
    return <LockedPage title="KYC" body="Login to prepare your worker verification details." onLogin={onLogin} />
  }

  return (
    <section className="content-page narrow-page page-enter">
      <PageHeader eyebrow="KYC" title="Worker verification" body="A clean frontend flow for social worker review. Storage for KYC submissions can be added next." />
      <form className="form-panel" onSubmit={onSubmit}>
        <label>
          Organization
          <input required value={kycForm.organization} onChange={(event) => setKycForm({ ...kycForm, organization: event.target.value })} />
        </label>
        <div className="form-grid">
          <label>
            Phone
            <input required value={kycForm.phone} onChange={(event) => setKycForm({ ...kycForm, phone: event.target.value })} />
          </label>
          <label>
            District
            <input required value={kycForm.district} onChange={(event) => setKycForm({ ...kycForm, district: event.target.value })} />
          </label>
        </div>
        <label>
          Verification document
          <input accept="image/*,.pdf" disabled={isUploading} type="file" onChange={(event) => onDocumentUpload(event.target.files?.[0])} />
        </label>
        {kycForm.documentUrl && (
          <a className="document-link" href={kycForm.documentUrl} target="_blank" rel="noreferrer">
            <FileCheck2 size={16} />
            Uploaded KYC document
          </a>
        )}
        {uploadMessage && <p className="form-message">{uploadMessage}</p>}
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
