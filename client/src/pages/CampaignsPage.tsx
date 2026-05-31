import { BadgeCheck, HandHeart, Landmark, MapPin } from 'lucide-react'
import type { ReliefPost } from '../types/app'
import { PageHeader } from '../components/PageHeader'
import { RequestList } from '../components/RequestList'

type CampaignsPageProps = {
  publicRequests: ReliefPost[]
  onActionSuccess?: () => void
}

const categories = ['FOOD', 'CLOTHES', 'VOLUNTEER', 'MONEY', 'OTHER']

export function CampaignsPage({ publicRequests, onActionSuccess }: CampaignsPageProps) {
  const fundraisingPosts = publicRequests.filter((request) => request.postType === 'FUNDRAISING')
  const helpPosts = publicRequests.filter((request) => request.postType === 'HELP')

  return (
    <section className="content-page page-enter">
      <PageHeader
        eyebrow="Campaigns"
        title="Approved relief campaigns"
        body="Public campaigns appear only after social worker KYC and admin review of the submitted authority document."
      />

      <div className="campaign-summary">
        <SummaryCard icon={<BadgeCheck size={20} />} label="Approved posts" value={publicRequests.length} />
        <SummaryCard icon={<Landmark size={20} />} label="Fundraisers" value={fundraisingPosts.length} />
        <SummaryCard icon={<HandHeart size={20} />} label="Help requests" value={helpPosts.length} />
      </div>

      <div className="campaign-grid">
        {categories.map((category) => {
          const categoryPosts = publicRequests.filter((request) => request.category === category)

          return (
            <article className="campaign-card" key={category}>
              <div className="campaign-icon">
                <MapPin size={22} />
              </div>
              <h2>{formatLabel(category)}</h2>
              <p>{categoryPosts.length} approved posts</p>
              <div className="progress-track">
                <span style={{ width: `${Math.min(categoryPosts.length * 20, 100)}%` }} />
              </div>
            </article>
          )
        })}
      </div>

      <section className="split-panel">
        <RequestList title="Fundraising campaigns" requests={fundraisingPosts} onActionSuccess={onActionSuccess} />
        <RequestList title="Help campaigns" requests={helpPosts} onActionSuccess={onActionSuccess} />
      </section>
    </section>
  )
}

function SummaryCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <article>
      <div className="feature-icon">{icon}</div>
      <span>{value}</span>
      <p>{label}</p>
    </article>
  )
}

function formatLabel(value: string) {
  return value.toLowerCase().replace(/^\w/, (character) => character.toUpperCase())
}
