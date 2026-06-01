import { HandHeart, MoreHorizontal, ShieldAlert, Shirt, Users, Utensils } from 'lucide-react'
import type { Page, ReliefPost } from '../types/app'
import { PageHeader } from '../components/PageHeader'
import { RequestList } from '../components/RequestList'

type RequestsPageProps = {
  publicRequests: ReliefPost[]
  onLogin: () => void
  onNavigate?: (page: Page) => void
  onActionSuccess?: () => void
  onOpenPost?: (post: ReliefPost) => void
}

const CATEGORY_META: { key: string; label: string; icon: React.ReactNode }[] = [
  { key: 'FOOD', label: 'Food', icon: <Utensils size={18} /> },
  { key: 'CLOTHES', label: 'Clothes', icon: <Shirt size={18} /> },
  { key: 'VOLUNTEER', label: 'Volunteers', icon: <Users size={18} /> },
  { key: 'OTHER', label: 'Other', icon: <MoreHorizontal size={18} /> },
]

export function RequestsPage({ publicRequests, onNavigate, onActionSuccess, onOpenPost }: RequestsPageProps) {
  const helpRequests = publicRequests
    .filter((post) => post.postType === 'HELP')

  const criticalCount = helpRequests.filter((post) => post.urgency === 'CRITICAL').length
  const highCount = helpRequests.filter((post) => post.urgency === 'HIGH').length

  return (
    <section className="content-page page-enter">
      <PageHeader
        eyebrow="Help requests"
        title="People who need help right now"
        body="Food, clothing, volunteers, and other material needs submitted by verified social workers and approved by admins after local verification."
      />

      <div className="campaign-summary">
        <SummaryCard icon={<HandHeart size={20} />} label="Open requests" value={helpRequests.length} />
        <SummaryCard icon={<ShieldAlert size={20} />} label="Critical urgency" value={criticalCount} />
        <SummaryCard icon={<ShieldAlert size={20} />} label="High urgency" value={highCount} />
      </div>

      <div className="campaign-grid">
        {CATEGORY_META.map(({ key, label, icon }) => {
          const count = helpRequests.filter((post) => post.category === key).length
          return (
            <article className="campaign-card" key={key}>
              <div className="campaign-icon">{icon}</div>
              <h2>{label}</h2>
              <p>
                {count} open {count === 1 ? 'request' : 'requests'}
              </p>
              <div className="progress-track">
                <span style={{ width: `${Math.min(count * 20, 100)}%` }} />
              </div>
            </article>
          )
        })}
      </div>

      <RequestList title="Help requests" requests={helpRequests} onActionSuccess={onActionSuccess} onOpenPost={onOpenPost} />

      {onNavigate && (
        <div className="toolbar" style={{ justifyContent: 'center', marginTop: '32px' }}>
          <button className="secondary-button" type="button" onClick={() => onNavigate('campaigns')}>
            View fundraising campaigns instead
          </button>
        </div>
      )}
    </section>
  )
}

function SummaryCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <article>
      <div className="feature-icon">{icon}</div>
      <div className="campaign-summary-text">
        <span>{value}</span>
        <p>{label}</p>
      </div>
    </article>
  )
}
