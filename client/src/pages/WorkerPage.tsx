import { useState } from 'react'
import { ClipboardCheck } from 'lucide-react'
import type { AuthUser, FileUploadHandler, ReliefPost, RequestForm, RequestSubmitHandler } from '../types/app'
import { LockedPage } from '../components/LockedPage'
import { PageHeader } from '../components/PageHeader'
import { RequestFormPanel } from '../components/RequestFormPanel'
import { RequestList } from '../components/RequestList'
import { StatCard } from '../components/StatCard'

type WorkerPageProps = {
  formMessage: string
  isApproved: boolean
  isUploading: boolean
  myOpenRequests: number
  myRequests: ReliefPost[]
  requestForm: RequestForm
  setRequestForm: (form: RequestForm) => void
  uploadMessage: string
  user: AuthUser | null
  onCreateRequest: RequestSubmitHandler
  onDocumentUpload: FileUploadHandler
  onLogin: () => void
  onKyc: () => void
  onActionSuccess?: () => void
}

export function WorkerPage({
  formMessage,
  isApproved,
  isUploading,
  myOpenRequests,
  myRequests,
  requestForm,
  setRequestForm,
  uploadMessage,
  user,
  onCreateRequest,
  onDocumentUpload,
  onLogin,
  onKyc,
  onActionSuccess,
}: WorkerPageProps) {
  const [tokenInput, setTokenInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const handleVerifyToken = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccessMsg('')
    setErrorMsg('')
    setLoading(true)

    try {
      const res = await fetch('/api/worker/pledges/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secureToken: tokenInput }),
      })
      const data = (await res.json().catch(() => ({}))) as { message?: string }

      if (!res.ok) {
        throw new Error(data.message || 'Verification failed.')
      }

      setSuccessMsg(data.message || 'Drop-off verified and completed successfully!')
      setTokenInput('')
      if (onActionSuccess) {
        onActionSuccess()
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return <LockedPage title="Worker console" body="Login with Google to access the worker dashboard." onLogin={onLogin} />
  }

  if (!isApproved) {
    const isRejected = user.status === 'REJECTED'

    return (
      <section className="content-page narrow-page page-enter">
        <PageHeader
          eyebrow="Verification required"
          title={isRejected ? 'KYC needs attention' : 'KYC approval pending'}
          body={
            isRejected
              ? 'Please update your verification details before creating a help request or fundraising campaign.'
              : 'Your account must be verified before you can create relief posts. You can still browse approved public campaigns.'
          }
        />
        <div className="notice-panel">
          <strong>{isRejected ? 'Update your verification' : 'Posting is locked for now'}</strong>
          <p>
            {isRejected
              ? 'Once your corrected details are reviewed and approved, campaign creation will be available.'
              : 'We will keep this area ready for you. Campaign creation opens automatically after KYC approval.'}
          </p>
          <button className="primary-button" type="button" onClick={onKyc}>
            {isRejected ? 'Update KYC' : 'View KYC status'}
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="content-page page-enter">
      <PageHeader eyebrow="Social worker console" title="Submit a verified post" body="Create help requests or fundraising campaigns with location, contact, and authority proof." />

      <div className="stats-grid">
        <StatCard label="Total requests" value={myRequests.length} />
        <StatCard label="Approved posts" value={myOpenRequests} />
        <StatCard label="Account status" value={user.status || 'PENDING'} />
      </div>
      <section className="split-panel">
        <RequestFormPanel
          formMessage={formMessage}
          isApproved={isApproved}
          isUploading={isUploading}
          requestForm={requestForm}
          setRequestForm={setRequestForm}
          uploadMessage={uploadMessage}
          onCreateRequest={onCreateRequest}
          onDocumentUpload={onDocumentUpload}
        />
        <div style={{ display: 'grid', gap: '20px' }}>
          <div className="form-panel" style={{ padding: '20px' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '18px', color: 'var(--primary-dark)' }}>
              <ClipboardCheck size={20} />
              Pledge Drop-off Verification
            </h2>
            <p style={{ margin: '8px 0', fontSize: '13px', color: 'var(--muted)', lineHeight: '1.4' }}>
              When a donor drops off pledged items, enter their alphanumeric token below to complete and credit the pledge.
            </p>
            <form onSubmit={handleVerifyToken} style={{ display: 'grid', gap: '10px', marginTop: '8px' }}>
              <label style={{ display: 'grid', gap: '6px', fontSize: '13px', fontWeight: 900, color: 'var(--primary-dark)', width: '100%' }}>
                Drop-off Token (e.g. US-XXXXXX)
                <input
                  required
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="Enter token code"
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                    background: 'var(--surface-strong)',
                    fontSize: '14px',
                    textTransform: 'uppercase',
                    width: '100%'
                  }}
                />
              </label>
              <button className="primary-button" type="submit" disabled={loading} style={{ minHeight: '38px' }}>
                {loading ? 'Verifying...' : 'Verify & Complete Drop-off'}
              </button>
            </form>
            {successMsg && <p style={{ color: 'var(--green)', margin: '8px 0 0', fontSize: '13px', fontWeight: 900 }}>{successMsg}</p>}
            {errorMsg && <p style={{ color: 'var(--danger)', margin: '8px 0 0', fontSize: '13px', fontWeight: 900 }}>{errorMsg}</p>}
          </div>

          <RequestList title="My submitted posts" requests={myRequests} />
        </div>
      </section>
    </section>
  )
}
