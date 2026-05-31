import type { AuthUser, FileUploadHandler, HelpRequest, RequestForm, RequestSubmitHandler } from '../types/app'
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
  myRequests: HelpRequest[]
  requestForm: RequestForm
  setRequestForm: (form: RequestForm) => void
  uploadMessage: string
  user: AuthUser | null
  onCreateRequest: RequestSubmitHandler
  onDocumentUpload: FileUploadHandler
  onLogin: () => void
  onKyc: () => void
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
}: WorkerPageProps) {
  if (!user) {
    return <LockedPage title="Worker console" body="Login with Google to access the worker dashboard." onLogin={onLogin} />
  }

  return (
    <section className="content-page page-enter">
      <PageHeader eyebrow="Worker console" title="Create verified help requests" body="Upload proof, record beneficiary details, and publish only after approval." />

      <div className="stats-grid">
        <StatCard label="Total requests" value={myRequests.length} />
        <StatCard label="Open requests" value={myOpenRequests} />
        <StatCard label="Account status" value={user.status || 'PENDING'} />
      </div>

      {!isApproved && (
        <div className="notice-panel">
          <strong>Approval required</strong>
          <p>Your account exists, but request posting stays locked until an admin approves your worker profile.</p>
          <button className="secondary-button" type="button" onClick={onKyc}>
            Complete KYC
          </button>
        </div>
      )}

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
        <RequestList title="My database requests" requests={myRequests} />
      </section>
    </section>
  )
}
