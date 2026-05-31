import {
  ArrowRight,
  BadgeCheck,
  ClipboardCheck,
  CloudUpload,
  HeartHandshake,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react'
import type { HelpRequest, Page } from '../types/app'
import { FeatureCard } from '../components/FeatureCard'

type HomePageProps = {
  apiStatus: string
  publicRequests: HelpRequest[]
  onLogin: () => void
  onSignup: () => void
  onNavigate: (page: Page) => void
}

export function HomePage({ apiStatus, publicRequests, onLogin, onSignup, onNavigate }: HomePageProps) {
  return (
    <section className="home-page page-enter">
      <div className="hero-copy">
        <p className="eyebrow">
          <Sparkles size={16} />
          Trusted disaster relief platform
        </p>
        <h1>Verified help requests for faster, cleaner disaster response.</h1>
        <p className="lead">
          UddharSetu gives approved social workers a calm workspace to document needs, upload proof, and publish requests donors can trust.
        </p>
        <div className="cta-row">
          <button className="primary-button" type="button" onClick={onSignup}>
            Start with Google
            <ArrowRight size={18} />
          </button>
          <button className="secondary-button" type="button" onClick={onLogin}>
            Login
          </button>
          <button className="text-button" type="button" onClick={() => onNavigate('requests')}>
            View public requests
          </button>
        </div>
        <div className="status-row" aria-live="polite">
          <span className="status-dot" />
          <span>{apiStatus}</span>
        </div>
      </div>

      <div className="hero-visual" aria-label="Relief workflow preview">
        <div className="flow-line" />
        <div className="flow-card intake">
          <ClipboardCheck size={20} />
          Intake
        </div>
        <div className="flow-card verify">
          <ShieldCheck size={20} />
          Verify
        </div>
        <div className="flow-card publish">
          <HeartHandshake size={20} />
          Publish
        </div>
        <div className="hero-stat">
          <span>{publicRequests.length}</span>
          <p>Open database requests</p>
        </div>
      </div>

      <section className="feature-grid" aria-label="Platform features">
        <FeatureCard icon={<BadgeCheck size={20} />} title="Google auth" body="Workers sign in through verified Google identity and server sessions." />
        <FeatureCard icon={<CloudUpload size={20} />} title="Cloudinary media" body="Authority documents upload through signed direct media handling." />
        <FeatureCard icon={<LayoutDashboard size={20} />} title="Worker console" body="Approved accounts can create, track, and manage relief requests." />
        <FeatureCard icon={<Users size={20} />} title="Admin review" body="Admin-facing screens are ready for approval workflows." />
      </section>
    </section>
  )
}
