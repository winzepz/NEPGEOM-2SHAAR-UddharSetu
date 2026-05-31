import type { ReliefPost } from '../types/app'
import { PageHeader } from '../components/PageHeader'
import { RequestList } from '../components/RequestList'

type RequestsPageProps = {
  publicRequests: ReliefPost[]
  onSignup: () => void
  onActionSuccess?: () => void
}

export function RequestsPage({ publicRequests, onSignup, onActionSuccess }: RequestsPageProps) {
  const helpRequests = publicRequests.filter((request) => request.postType === 'HELP')

  return (
    <section className="content-page page-enter">
      <PageHeader
        eyebrow="Public help board"
        title="Approved help requests"
        body="Food, clothing, volunteer, and material requests approved by admins after local verification."
      />
      <div className="toolbar">
        <button className="primary-button" type="button" onClick={onSignup}>
          Submit as social worker
        </button>
      </div>
      <RequestList title="Help requests" requests={helpRequests} onActionSuccess={onActionSuccess} />
    </section>
  )
}
