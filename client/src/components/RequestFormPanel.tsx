import { FileCheck2 } from 'lucide-react'
import type { FileUploadHandler, RequestForm, RequestSubmitHandler } from '../types/app'

type RequestFormPanelProps = {
  formMessage: string
  isApproved: boolean
  isUploading: boolean
  requestForm: RequestForm
  setRequestForm: (form: RequestForm) => void
  uploadMessage: string
  onCreateRequest: RequestSubmitHandler
  onDocumentUpload: FileUploadHandler
}

export function RequestFormPanel({
  formMessage,
  isApproved,
  isUploading,
  requestForm,
  setRequestForm,
  uploadMessage,
  onCreateRequest,
  onDocumentUpload,
}: RequestFormPanelProps) {
  return (
    <form className="form-panel" onSubmit={onCreateRequest}>
      <h2>Post details</h2>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', background: 'rgba(245, 237, 214, 0.75)', padding: '4px', borderRadius: '8px' }}>
        <button
          type="button"
          className={requestForm.postType === 'HELP' ? 'primary-button compact' : 'ghost-button'}
          style={{ flex: 1, border: 0, padding: '8px', minHeight: '36px', boxShadow: requestForm.postType === 'HELP' ? undefined : 'none' }}
          onClick={() => setRequestForm({ ...requestForm, postType: 'HELP' })}
        >
          Material Help Request
        </button>
        <button
          type="button"
          className={requestForm.postType === 'FUNDRAISING' ? 'primary-button compact' : 'ghost-button'}
          style={{ flex: 1, border: 0, padding: '8px', minHeight: '36px', boxShadow: requestForm.postType === 'FUNDRAISING' ? undefined : 'none' }}
          onClick={() => setRequestForm({ ...requestForm, postType: 'FUNDRAISING' })}
        >
          Financial Fundraiser
        </button>
      </div>
      <label>
        Title
        <input required value={requestForm.title} onChange={(event) => setRequestForm({ ...requestForm, title: event.target.value })} />
      </label>
      <label>
        Description
        <textarea required rows={4} value={requestForm.description} onChange={(event) => setRequestForm({ ...requestForm, description: event.target.value })} />
      </label>
      <div className="form-grid">
        <label>
          Category
          <select value={requestForm.category} onChange={(event) => setRequestForm({ ...requestForm, category: event.target.value })}>
            <option value="FOOD">Food</option>
            <option value="CLOTHES">Clothes</option>
            <option value="VOLUNTEER">Volunteer</option>
            <option value="MONEY">Money</option>
            <option value="OTHER">Other</option>
          </select>
        </label>
        <label>
          Urgency
          <select value={requestForm.urgency} onChange={(event) => setRequestForm({ ...requestForm, urgency: event.target.value })}>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </label>
      </div>
      <div className="form-grid">
        <label>
          Latitude
          <input required type="number" step="any" value={requestForm.latitude} onChange={(event) => setRequestForm({ ...requestForm, latitude: event.target.value })} />
        </label>
        <label>
          Longitude
          <input required type="number" step="any" value={requestForm.longitude} onChange={(event) => setRequestForm({ ...requestForm, longitude: event.target.value })} />
        </label>
      </div>
      <label>
        Authority or verification letter
        <input accept="image/*,.pdf" disabled={!isApproved || isUploading} type="file" onChange={(event) => onDocumentUpload(event.target.files?.[0])} />
      </label>
      {requestForm.authorityDocumentUrl && (
        <a className="document-link" href={requestForm.authorityDocumentUrl} target="_blank" rel="noreferrer">
          <FileCheck2 size={16} />
          Uploaded verification letter
        </a>
      )}
      {uploadMessage && <p className="form-message">{uploadMessage}</p>}
      <div className="form-grid">
        <label>
          Beneficiary name
          <input required value={requestForm.beneficiaryName} onChange={(event) => setRequestForm({ ...requestForm, beneficiaryName: event.target.value })} />
        </label>
        <label>
          Beneficiary phone
          <input required value={requestForm.beneficiaryPhone} onChange={(event) => setRequestForm({ ...requestForm, beneficiaryPhone: event.target.value })} />
        </label>
      </div>
      <div className="form-grid">
        <label>
          Point of contact
          <input required value={requestForm.pointOfContactName} onChange={(event) => setRequestForm({ ...requestForm, pointOfContactName: event.target.value })} />
        </label>
        <label>
          Contact phone
          <input required value={requestForm.pointOfContactPhone} onChange={(event) => setRequestForm({ ...requestForm, pointOfContactPhone: event.target.value })} />
        </label>
      </div>
      <div className="form-grid">
        <label>
          Local representative
          <input required value={requestForm.localRepresentativeName} onChange={(event) => setRequestForm({ ...requestForm, localRepresentativeName: event.target.value })} />
        </label>
        <label>
          Representative phone
          <input required value={requestForm.localRepresentativePhone} onChange={(event) => setRequestForm({ ...requestForm, localRepresentativePhone: event.target.value })} />
        </label>
      </div>
      {requestForm.postType === 'HELP' ? (
        <label>
          Target quantity
          <input required min="1" type="number" value={requestForm.targetQuantity} onChange={(event) => setRequestForm({ ...requestForm, targetQuantity: event.target.value })} />
        </label>
      ) : (
        <label>
          Fundraising target amount
          <input required min="1" type="number" value={requestForm.targetAmount} onChange={(event) => setRequestForm({ ...requestForm, targetAmount: event.target.value })} />
        </label>
      )}
      <button className="primary-button" type="submit" disabled={!isApproved || isUploading || !requestForm.authorityDocumentUrl}>
        Submit for admin review
      </button>
      {formMessage && <p className="form-message">{formMessage}</p>}
    </form>
  )
}
