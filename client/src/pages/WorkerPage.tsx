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
  imageUploadMessage: string
  uploadMessage: string
  user: AuthUser | null
  onCreateRequest: RequestSubmitHandler
  onImageUpload: FileUploadHandler
  onDocumentUpload: FileUploadHandler
  onLogin: () => void
  onKyc: () => void
  onActionSuccess?: () => void
}

type DashTab = 'create' | 'posts'

export function WorkerPage({
  formMessage,
  isApproved,
  isUploading,
  myOpenRequests,
  myRequests,
  requestForm,
  setRequestForm,
  imageUploadMessage,
  uploadMessage,
  user,
  onCreateRequest,
  onImageUpload,
  onDocumentUpload,
  onLogin,
  onKyc,
  onActionSuccess,
}: WorkerPageProps) {
  const [activeTab, setActiveTab] = useState<DashTab>('create')

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
              : 'Campaign creation opens automatically after KYC approval.'}
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
      <div className="dash-header">
        <PageHeader
          eyebrow="Dashboard"
          title={`Welcome, ${user.fullName?.split(' ')[0] ?? 'Worker'}`}
          body="Manage your verified relief posts and track your campaign impact."
        />
      </div>

      <div className="stats-grid">
        <StatCard icon={<ListChecks size={18} />} label="Total posts submitted" value={myRequests.length} />
        <StatCard icon={<BadgeCheck size={18} />} label="Approved & live" value={myOpenRequests} accentColor="var(--green)" />
        <StatCard icon={<ClipboardCheck size={18} />} label="Account status" value={user.status || 'PENDING'} accentColor={statusColor} />
      </div>

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
      </nav>

      {activeTab === 'create' && (
        <div className="page-enter">
          <RequestFormPanel
            formMessage={formMessage}
            isApproved={isApproved}
            isUploading={isUploading}
            requestForm={requestForm}
            setRequestForm={setRequestForm}
            imageUploadMessage={imageUploadMessage}
            uploadMessage={uploadMessage}
            onCreateRequest={onCreateRequest}
            onImageUpload={onImageUpload}
            onDocumentUpload={onDocumentUpload}
          />
        </div>
      )}

      {activeTab === 'posts' && (
        <div className="page-enter">
          <RequestList title="My submitted posts" requests={myRequests} onActionSuccess={onActionSuccess} />
        </div>
      )}
    </section>
  )
}
