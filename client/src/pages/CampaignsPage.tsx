import { BadgeCheck, Landmark, Target, TrendingUp } from 'lucide-react'
import type { Page, ReliefPost } from '../types/app'
import { PageHeader } from '../components/PageHeader'
import { RequestList } from '../components/RequestList'

type CampaignsPageProps = {
  publicRequests: ReliefPost[]
  onNavigate?: (page: Page) => void
  onActionSuccess?: () => void
}

export function CampaignsPage({ publicRequests, onNavigate, onActionSuccess }: CampaignsPageProps) {
  const campaigns = publicRequests.filter((p) => p.postType === 'FUNDRAISING')
  const totalRaised = campaigns.reduce((sum, p) => sum + Number(p.fulfilledAmount ?? 0), 0)
  const withGoal = campaigns.filter((p) => p.targetAmount != null).length
  const totalGoal = campaigns.reduce((sum, p) => sum + Number(p.targetAmount ?? 0), 0)

  return (
    <section className="content-page page-enter">
      <PageHeader
        eyebrow="Fundraising"
        title="Active fundraising campaigns"
        body="Financial campaigns submitted by verified social workers and approved by admins. Every campaign includes local authority documentation."
      />

      <div className="campaign-summary">
        <SummaryCard icon={<BadgeCheck size={20} />} label="Live campaigns" value={campaigns.length} />
        <SummaryCard
          icon={<Landmark size={20} />}
          label="Total raised (NPR)"
          value={totalRaised > 0 ? `Rs. ${totalRaised.toLocaleString()}` : 'Rs. 0'}
        />
        <SummaryCard
          icon={<Target size={20} />}
          label="Total goal (NPR)"
          value={totalGoal > 0 ? `Rs. ${totalGoal.toLocaleString()}` : '—'}
        />
      </div>

      {totalGoal > 0 && (
        <div className="campaign-overall-progress">
          <div className="campaign-overall-meta">
            <span className="campaign-overall-label">
              <TrendingUp size={14} />
              Overall campaign progress
            </span>
            <span className="campaign-overall-pct">
              {Math.min(Math.round((totalRaised / totalGoal) * 100), 100)}%
            </span>
          </div>
          <div className="progress-track">
            <span style={{ width: `${Math.min(Math.round((totalRaised / totalGoal) * 100), 100)}%` }} />
          </div>
          <p className="campaign-overall-sub">
            Rs. {totalRaised.toLocaleString()} raised of Rs. {totalGoal.toLocaleString()} total goal across {withGoal} campaign{withGoal !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      <RequestList title="Fundraising campaigns" requests={campaigns} onActionSuccess={onActionSuccess} />

      {onNavigate && (
        <div className="toolbar" style={{ justifyContent: 'center', marginTop: '8px' }}>
          <button className="secondary-button" type="button" onClick={() => onNavigate('requests')}>
            View help requests instead
          </button>
        </div>
      )}
    </section>
  )
}

function SummaryCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
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
