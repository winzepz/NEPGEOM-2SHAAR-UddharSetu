import { FileCheck2 } from 'lucide-react'
import type { FileUploadHandler, RequestForm, RequestSubmitHandler } from '../types/app'
import { LocationPicker } from './LocationPicker'

type RequestFormPanelProps = {
  formMessage: string
  isApproved: boolean
  isUploading: boolean
  requestForm: RequestForm
  setRequestForm: (form: RequestForm) => void
  imageUploadMessage: string
  uploadMessage: string
  onCreateRequest: RequestSubmitHandler
  onImageUpload: FileUploadHandler
  onDocumentUpload: FileUploadHandler
}

const helpCategories = [
  { value: 'FOOD', label: 'Food' },
  { value: 'CLOTHES', label: 'Clothes' },
  { value: 'VOLUNTEER', label: 'Volunteer' },
  { value: 'OTHER', label: 'Other' },
]

const fundraiserCategories = [
  { value: 'MEDICAL', label: 'Medical' },
  { value: 'SUPPLY', label: 'Supply' },
  { value: 'OTHER', label: 'Other' },
]

export function RequestFormPanel({
  formMessage,
  isApproved,
  isUploading,
  requestForm,
  setRequestForm,
  imageUploadMessage,
  uploadMessage,
  onCreateRequest,
  onImageUpload,
  onDocumentUpload,
}: RequestFormPanelProps) {
  const isHelp = requestForm.postType === 'HELP'
  const categories = isHelp ? helpCategories : fundraiserCategories

  return (
    <form className="form-panel" onSubmit={onCreateRequest}>
      <h2>Post details</h2>

      {/* Post type switcher */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', background: 'rgba(245, 237, 214, 0.75)', padding: '4px', borderRadius: '8px' }}>
        <button
          type="button"
          className={requestForm.postType === 'HELP' ? 'primary-button compact' : 'ghost-button'}
          style={{ flex: 1, border: 0, padding: '8px', minHeight: '36px', boxShadow: requestForm.postType === 'HELP' ? undefined : 'none' }}
          onClick={() => setRequestForm({ ...requestForm, postType: 'HELP', category: 'FOOD', targetAmount: '' })}
        >
          Material Help Request
        </button>
        <button
          type="button"
          className={requestForm.postType === 'FUNDRAISING' ? 'primary-button compact' : 'ghost-button'}
          style={{ flex: 1, border: 0, padding: '8px', minHeight: '36px', boxShadow: requestForm.postType === 'FUNDRAISING' ? undefined : 'none' }}
          onClick={() => setRequestForm({ ...requestForm, postType: 'FUNDRAISING', category: 'MEDICAL', targetQuantity: '1' })}
        >
          Financial Fundraiser
        </button>
      </div>

      <label>
        Title
        <input required value={requestForm.title} onChange={(e) => setRequestForm({ ...requestForm, title: e.target.value })} />
      </label>

      <label>
        Description
        <textarea required rows={4} value={requestForm.description} onChange={(e) => setRequestForm({ ...requestForm, description: e.target.value })} />
      </label>

      <div className="form-grid">
        <label>
          Category
          <select value={requestForm.category} onChange={(e) => setRequestForm({ ...requestForm, category: e.target.value })}>
            {categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </label>
        {isHelp ? (
          <label>
            Urgency
            <select value={requestForm.urgency} onChange={(e) => setRequestForm({ ...requestForm, urgency: e.target.value })}>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </label>
        ) : (
          <label>
            Fundraiser type
            <input value="Financial campaign" readOnly />
          </label>
        )}
      </div>

      {/* Map location picker */}
      <div>
        <p style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>
          Location <span style={{ color: 'var(--danger, #c0392b)' }}>*</span>
        </p>
        <LocationPicker
          lat={requestForm.latitude}
          lng={requestForm.longitude}
          onChange={(lat, lng) => setRequestForm({ ...requestForm, latitude: lat, longitude: lng })}
        />
      </div>

      <div className="form-grid">
        <label>
          {isHelp ? 'Help request image' : 'Fundraiser main image'}
          <input
            accept="image/*"
            disabled={!isApproved || isUploading}
            type="file"
            onChange={(e) => onImageUpload(e.target.files?.[0])}
          />
        </label>
        <label>
          Authority or verification document
          <input
            accept="image/*,.pdf"
            disabled={!isApproved || isUploading}
            type="file"
            onChange={(e) => onDocumentUpload(e.target.files?.[0])}
          />
        </label>
      </div>
      {requestForm.imageUrl && (
        <a className="document-link" href={requestForm.imageUrl} target="_blank" rel="noreferrer">
          <FileCheck2 size={16} />
          Uploaded {isHelp ? 'help image' : 'fundraiser image'}
        </a>
      )}
      {imageUploadMessage && <p className="form-message">{imageUploadMessage}</p>}
      <label>
        Verification requirement
        <input value="Upload an image plus an authority/verification document before submitting." readOnly />
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
          <input required value={requestForm.beneficiaryName} onChange={(e) => setRequestForm({ ...requestForm, beneficiaryName: e.target.value })} />
        </label>
        <label>
          Beneficiary phone
          <input required value={requestForm.beneficiaryPhone} onChange={(e) => setRequestForm({ ...requestForm, beneficiaryPhone: e.target.value })} />
        </label>
      </div>

      <div className="form-grid">
        <label>
          Point of contact
          <input required value={requestForm.pointOfContactName} onChange={(e) => setRequestForm({ ...requestForm, pointOfContactName: e.target.value })} />
        </label>
        <label>
          Contact phone
          <input required value={requestForm.pointOfContactPhone} onChange={(e) => setRequestForm({ ...requestForm, pointOfContactPhone: e.target.value })} />
        </label>
      </div>

      <div className="form-grid">
        <label>
          Local representative
          <input required value={requestForm.localRepresentativeName} onChange={(e) => setRequestForm({ ...requestForm, localRepresentativeName: e.target.value })} />
        </label>
        <label>
          Representative phone
          <input required value={requestForm.localRepresentativePhone} onChange={(e) => setRequestForm({ ...requestForm, localRepresentativePhone: e.target.value })} />
        </label>
      </div>

      {requestForm.postType === 'HELP' ? (
        <label>
          Target quantity
          <input required min="1" type="number" value={requestForm.targetQuantity} onChange={(e) => setRequestForm({ ...requestForm, targetQuantity: e.target.value })} />
        </label>
      ) : (
        <label>
          Fundraising target amount (NPR)
          <input required min="1" type="number" value={requestForm.targetAmount} onChange={(e) => setRequestForm({ ...requestForm, targetAmount: e.target.value })} />
        </label>
      )}

      <button
        className="primary-button"
        type="submit"
        disabled={
          !isApproved ||
          isUploading ||
          !requestForm.imageUrl ||
          !requestForm.authorityDocumentUrl ||
          !requestForm.latitude ||
          !requestForm.longitude
        }
      >
        Submit for admin review
      </button>
      {formMessage && <p className="form-message">{formMessage}</p>}
    </form>
  )
}
