import { HeartHandshake } from 'lucide-react'
import type { HelpRequest } from '../types/app'
import { PageHeader } from '../components/PageHeader'

type CampaignsPageProps = {
  publicRequests: HelpRequest[]
}

const categories = ['FOOD', 'CLOTHES', 'VOLUNTEER', 'MONEY', 'OTHER']

export function CampaignsPage({ publicRequests }: CampaignsPageProps) {
  return (
    <section className="content-page page-enter">
      <PageHeader
        eyebrow="Campaigns"
        title="Relief campaign view"
        body="Campaign sections group live requests by need category. Empty categories stay empty until the database has matching requests."
      />
      <div className="campaign-grid">
        {categories.map((category) => {
          const count = publicRequests.filter((request) => request.category === category).length

          return (
            <article className="campaign-card" key={category}>
              <div className="campaign-icon">
                <HeartHandshake size={22} />
              </div>
              <h2>{category.toLowerCase()}</h2>
              <p>{count} open requests</p>
              <div className="progress-track">
                <span style={{ width: `${Math.min(count * 20, 100)}%` }} />
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
