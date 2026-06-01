import { HandHeart, ShieldAlert, Utensils, Shirt, Users, HeartPulse, MoreHorizontal } from 'lucide-react'
import type { Page, ReliefPost } from '../types/app'
import { PageHeader } from '../components/PageHeader'
import { RequestList } from '../components/RequestList'

type RequestsPageProps = {
  publicRequests: ReliefPost[]
  onLogin: () => void
  onNavigate?: (page: Page) => void
  onActionSuccess?: () => void
}

const urgencyOrder: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2 }

const CATEGORY_META: { key: string; label: string; icon: React.ReactNode }[] = [
  { key: 'FOOD', label: 'Food', icon: <Utensils size={18} /> },
  { key: 'CLOTHES', label: 'Clothes', icon: <Shirt size={18} /> },
  { key: 'VOLUNTEER', label: 'Volunteers', icon: <Users size={18} /> },
  { key: 'MONEY', label: 'Medical / Money', icon: <HeartPulse size={18} /> },
  { key: 'OTHER', label: 'Other', icon: <MoreHorizontal size={18} /> },
]

export function RequestsPage({ publicRequests, onLogin, onNavigate, onActionSuccess }: RequestsPageProps) {
  const helpRequests = publicRequests
    .filter((p) => p.postType === 'HELP')
    .sort((a, b) => (urgencyOrder[a.urgency] ?? 9) - (urgencyOrder[b.urgency] ?? 9))

  const criticalCount = helpRequests.filter((p) => p.urgency === 'CRITICAL').length
  const highCount = helpRequests.filter((p) => p.urgency === 'HIGH').length

  return (
    <section className="content-page page-enter">
      <div className="page-header-row">
        <PageHeader
          eyebrow="Help requests"
          title="People who need help right now"
          body="Material needs — food, clothing, volunteers — submitted by verified social workers and approved by admins after local verification."
        />
        <button className="primary-button" type="button" onClick={onLogin} style={{ alignSelf: 'flex-start', flexShrink: 0 }}>
          Submit as social worker
        </button>
      </div>

      <div className="campaign-summary">
        <SummaryCard icon={<HandHeart size={20} />} label="Open requests" value={helpRequests.length} />
        <SummaryCard icon={<ShieldAlert size={20} />} label="Critical urgency" value={criticalCount} />
        <SummaryCard icon={<ShieldAlert size={20} />} label="High urgency" value={highCount} />
      </div>

      <div className="campaign-grid">
        {CATEGORY_META.map(({ key, label, icon }) => {
          const count = helpRequests.filter((p) => p.category === key).length
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

      <RequestList title="Help requests" requests={helpRequests} onActionSuccess={onActionSuccess} />

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
