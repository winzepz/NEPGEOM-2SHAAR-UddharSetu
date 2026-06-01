import { useState } from 'react'
import { BadgeCheck, ClipboardCheck, FilePlus2, FileSearch, ListChecks } from 'lucide-react'
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

type DashTab = 'create' | 'posts' | 'verify'

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
  const [activeTab, setActiveTab] = useState<DashTab>('create')

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
      if (!res.ok) throw new Error(data.message || 'Verification failed.')
      setSuccessMsg(data.message || 'Drop-off verified and completed successfully!')
      setTokenInput('')
      onActionSuccess?.()
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return <LockedPage title="Dashboard" body="Login with Google to access your social worker dashboard." onLogin={onLogin} />
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

  const statusColor = user.status === 'APPROVED' ? 'var(--green)' : user.status === 'REJECTED' ? 'var(--danger)' : undefined

  return (
    <section className="content-page page-enter">
      {/* ── Header ── */}
      <div className="dash-header">
        <PageHeader
          eyebrow="Dashboard"
          title={`Welcome, ${user.fullName?.split(' ')[0] ?? 'Worker'}`}
          body="Manage your verified relief posts, confirm drop-offs, and track your campaign impact."
        />
      </div>

      {/* ── Stats ── */}
      <div className="stats-grid">
        <StatCard icon={<ListChecks size={18} />} label="Total posts submitted" value={myRequests.length} />
        <StatCard icon={<BadgeCheck size={18} />} label="Approved & live" value={myOpenRequests} accentColor="var(--green)" />
        <StatCard icon={<ClipboardCheck size={18} />} label="Account status" value={user.status || 'PENDING'} accentColor={statusColor} />
      </div>

      {/* ── Tab bar ── */}
      <nav className="dash-tabs">
        <button
          type="button"
          className={`dash-tab-btn${activeTab === 'create' ? ' active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          <FilePlus2 size={15} />
          Create post
        </button>
        <button
          type="button"
          className={`dash-tab-btn${activeTab === 'posts' ? ' active' : ''}`}
          onClick={() => setActiveTab('posts')}
        >
          <FileSearch size={15} />
          My posts
          {myRequests.length > 0 && <span className="dash-tab-count">{myRequests.length}</span>}
        </button>
        <button
          type="button"
          className={`dash-tab-btn${activeTab === 'verify' ? ' active' : ''}`}
          onClick={() => setActiveTab('verify')}
        >
          <ClipboardCheck size={15} />
          Verify drop-off
        </button>
      </nav>

      {/* ── Create post tab ── */}
      {activeTab === 'create' && (
        <div className="page-enter">
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
        </div>
      )}

      {/* ── My posts tab ── */}
      {activeTab === 'posts' && (
        <div className="page-enter">
          <RequestList title="My submitted posts" requests={myRequests} onActionSuccess={onActionSuccess} />
        </div>
      )}

      {/* ── Verify drop-off tab ── */}
      {activeTab === 'verify' && (
        <div className="dash-verify-panel page-enter">
          <div className="dash-verify-header">
            <ClipboardCheck size={22} />
            <div>
              <h2>Pledge drop-off verification</h2>
              <p>When a donor arrives with pledged items, enter their token to mark the drop-off complete and credit the post.</p>
            </div>
          </div>
          <form className="dash-verify-form" onSubmit={handleVerifyToken}>
            <label className="dash-verify-label">
              Drop-off token
              <span className="dash-verify-hint">e.g. US-A3F9B2</span>
              <input
                required
                className="dash-verify-input"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
                placeholder="US-XXXXXX"
                spellCheck={false}
              />
            </label>
            <button className="primary-button" type="submit" disabled={loading}>
              {loading ? 'Verifying…' : 'Verify & complete drop-off'}
            </button>
            {successMsg && <p className="dash-verify-success">{successMsg}</p>}
            {errorMsg && <p className="dash-verify-error">{errorMsg}</p>}
          </form>
        </div>
      )}
    </section>
  )
}
