import type { HelpRequest } from '../types/app'
import { PageHeader } from '../components/PageHeader'
import { RequestList } from '../components/RequestList'

type RequestsPageProps = {
  publicRequests: HelpRequest[]
  onSignup: () => void
}

export function RequestsPage({ publicRequests, onSignup }: RequestsPageProps) {
  return (
    <section className="content-page page-enter">
      <PageHeader eyebrow="Public portal" title="Open help requests" body="This feed only renders requests returned by the database API." />
      <div className="toolbar">
        <button className="primary-button" type="button" onClick={onSignup}>
          Become a verified worker
        </button>
      </div>
      <RequestList title="Live request feed" requests={publicRequests} />
    </section>
  )
}
