import {
  ArrowRight,
  BadgeCheck,
  ClipboardCheck,
  HeartHandshake,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  Users,
} from 'lucide-react'
import type { AuthUser, Page, ReliefPost } from '../types/app'
import { FeatureCard } from '../components/FeatureCard'
import { RequestList } from '../components/RequestList'

type HomePageProps = {
  apiStatus: string
  publicRequests: ReliefPost[]
  user: AuthUser | null
  onLogin: () => void
  onSignup: () => void
  onNavigate: (page: Page) => void
  onActionSuccess?: () => void
}

export function HomePage({ apiStatus, publicRequests, user, onLogin, onSignup, onNavigate, onActionSuccess }: HomePageProps) {
  const fundraisingCount = publicRequests.filter((request) => request.postType === 'FUNDRAISING').length
  const helpCount = publicRequests.filter((request) => request.postType === 'HELP').length

  return (
    <section className="home-page page-enter">
      <div className="hero-copy">
        <p className="eyebrow">
          <ShieldCheck size={16} />
          Verified disaster relief network
        </p>
        <h1>Verified relief, routed from the ground to the people ready to help.</h1>
        <p className="lead">
          UddharSetu lets approved social workers document real needs, upload local authority proof, and publish help or fundraising campaigns only after review.
        </p>
        {user ? (
          <div className="cta-row">
            <button className="primary-button" type="button" onClick={() => onNavigate(user.status === 'APPROVED' ? 'worker' : 'kyc')}>
              {user.status === 'APPROVED' ? 'Open worker console' : 'Complete KYC'}
              <ArrowRight size={18} />
            </button>
            <button className="secondary-button" type="button" onClick={() => onNavigate('campaigns')}>
              View public campaigns
            </button>
          </div>
        ) : (
          <div className="cta-row">
            <button className="primary-button" type="button" onClick={onSignup}>
              Start verification
              <ArrowRight size={18} />
            </button>
            <button className="secondary-button" type="button" onClick={onLogin}>
              Login
            </button>
            <button className="text-button" type="button" onClick={() => onNavigate('campaigns')}>
              View campaigns
            </button>
          </div>
        )}
        <div className="status-row" aria-live="polite">
          <span className="status-dot" />
          <span>{apiStatus}</span>
        </div>
      </div>

      <div className="hero-visual" aria-label="Relief workflow preview">
        <div className="map-panel">
          <div className="map-grid" />
          <span className="map-pin pin-one" />
          <span className="map-pin pin-two" />
          <span className="map-pin pin-three" />
        </div>
        <div className="flow-card intake">
          <ClipboardCheck size={20} />
          Field report
        </div>
        <div className="flow-card publish">
          <ShieldAlert size={20} />
          Admin review
        </div>
        <div className="flow-card verify">
          <HeartHandshake size={20} />
          Public campaign
        </div>
        <div className="hero-stat">
          <span>{publicRequests.length}</span>
          <p>Approved public posts</p>
        </div>
        <div className="hero-metrics">
          <div>
            <strong>{helpCount}</strong>
            <span>Help</span>
          </div>
          <div>
            <strong>{fundraisingCount}</strong>
            <span>Funds</span>
          </div>
        </div>
      </div>

      <section className="feature-grid" aria-label="Platform features">
        <FeatureCard icon={<BadgeCheck size={20} />} title="KYC gate" body="Workers complete identity verification before posting." />
        <FeatureCard icon={<MapPin size={20} />} title="Local proof" body="Posts include location, contacts, and authority documents." />
        <FeatureCard icon={<ClipboardCheck size={20} />} title="Review queue" body="Admins approve KYC and campaigns before publication." />
        <FeatureCard icon={<Users size={20} />} title="Public action" body="Donors see only reviewed help and fundraising posts." />
      </section>

      <section className="landing-feed">
        <div>
          <p className="eyebrow">Live board</p>
          <h2>Approved campaigns</h2>
        </div>
        <RequestList title="Public campaigns" requests={publicRequests.slice(0, 3)} onActionSuccess={onActionSuccess} />
      </section>
    </section>
  )
}
