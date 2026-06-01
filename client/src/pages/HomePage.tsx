import {
  ArrowRight,
  BadgeCheck,
  CircleDollarSign,
  ClipboardCheck,
  HandHeart,
  Landmark,
  MapPin,
  Package,
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
  onNavigate: (page: Page) => void
  onActionSuccess?: () => void
}

export function HomePage({ apiStatus, publicRequests, user, onLogin, onNavigate, onActionSuccess }: HomePageProps) {
  const fundraisingCount = publicRequests.filter((r) => r.postType === 'FUNDRAISING').length
  const helpCount = publicRequests.filter((r) => r.postType === 'HELP').length

  const primaryPage: Page = !user
    ? 'home'
    : user.role === 'SUPER_ADMIN'
      ? 'admin'
      : user.status === 'APPROVED'
        ? 'worker'
        : 'kyc'

  const primaryLabel = !user
    ? ''
    : user.role === 'SUPER_ADMIN'
      ? 'Open admin panel'
      : user.status === 'APPROVED'
        ? 'Open worker console'
        : 'Complete KYC'

  return (
    <section className="home-page page-enter">

      {/* ── HERO ── */}
      <div className="home-hero">
        <div className="home-hero-inner">
          <p className="eyebrow home-hero-eyebrow">
            <ShieldCheck size={15} />
            Verified disaster relief network
          </p>
          <h1 className="home-hero-headline">
            Real needs.<br />
            Verified help.<br />
            Direct impact.
          </h1>
          <p className="lead home-hero-lead">
            UddharSetu connects approved social workers with donors — every campaign carries local authority proof and passes admin review before going public.
          </p>
          <div className="cta-row home-hero-cta">
            {user ? (
              <button className="primary-button" type="button" onClick={() => onNavigate(primaryPage)}>
                {primaryLabel}
                <ArrowRight size={18} />
              </button>
            ) : (
              <button className="primary-button" type="button" onClick={onLogin}>
                Login to get started
                <ArrowRight size={18} />
              </button>
            )}
            <button className="secondary-button" type="button" onClick={() => onNavigate('requests')}>
              Browse help requests
            </button>
          </div>
          <div className="home-hero-metrics">
            <div>
              <strong>{publicRequests.length}</strong>
              <span>Approved posts</span>
            </div>
            <div className="home-hero-divider" />
            <div>
              <strong>{helpCount}</strong>
              <span>Help requests</span>
            </div>
            <div className="home-hero-divider" />
            <div>
              <strong>{fundraisingCount}</strong>
              <span>Fundraisers</span>
            </div>
          </div>
        </div>
        <div className="home-hero-visual" aria-hidden="true">
          <div className="hero-panel">

            {/* Panel header */}
            <div className="hero-panel-header">
              <div className="hero-panel-live">
                <span className="hero-live-dot" />
                Live board
              </div>
              <span className="hero-panel-verified">
                <BadgeCheck size={12} />
                Admin verified
              </span>
            </div>

            {/* Fundraiser campaign */}
            <div className="hero-mini-card">
              <div className="hero-mini-top">
                <span className="hero-mini-type">
                  <CircleDollarSign size={10} />
                  Fundraiser
                </span>
                <span className="hero-mini-pct hero-mini-pct--fund">62%</span>
              </div>
              <div className="hero-mini-title">Flood Relief — Sindhupalchok</div>
              <div className="hero-mini-bar">
                <span className="hero-mini-fill--fund" style={{ width: '62%' }} />
              </div>
              <div className="hero-mini-sub">Rs. 62,000 of Rs. 1,00,000 raised</div>
            </div>

            {/* Material help campaign */}
            <div className="hero-mini-card">
              <div className="hero-mini-top">
                <span className="hero-mini-type hero-mini-type--help">
                  <Package size={10} />
                  Material Help
                </span>
                <span className="hero-mini-pct hero-mini-pct--help">38%</span>
              </div>
              <div className="hero-mini-title">Food &amp; Clothing — Kavre</div>
              <div className="hero-mini-bar">
                <span className="hero-mini-fill--help" style={{ width: '38%' }} />
              </div>
              <div className="hero-mini-sub">145 of 380 units fulfilled</div>
            </div>

            {/* Critical urgent */}
            <div className="hero-mini-card">
              <div className="hero-mini-top">
                <span className="hero-mini-type hero-mini-type--urgent">
                  <ShieldAlert size={10} />
                  Critical
                </span>
                <span className="hero-mini-pct hero-mini-pct--urgent">12%</span>
              </div>
              <div className="hero-mini-title">Emergency Shelter — Dolakha</div>
              <div className="hero-mini-bar">
                <span className="hero-mini-fill--urgent" style={{ width: '12%' }} />
              </div>
              <div className="hero-mini-sub">48 of 400 units · needs urgent help</div>
            </div>

            {/* Trust badges */}
            <div className="hero-trust-row">
              <div className="hero-trust-badge">
                <BadgeCheck size={12} />
                KYC Gate
              </div>
              <div className="hero-trust-badge">
                <ClipboardCheck size={12} />
                Admin Review
              </div>
              <div className="hero-trust-badge hero-trust-badge--live">
                <HandHeart size={12} />
                Live &amp; Verified
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── PATH CARDS ── */}
      <div className="path-grid">
        <div className="path-card path-card--help">
          <div className="path-card-icon">
            <HandHeart size={26} />
          </div>
          <div>
            <h2 className="path-card-title">Someone needs help</h2>
            <p className="path-card-body">
              Browse verified requests for food, clothing, volunteers and more. Every post is reviewed by our admin team with documented local authority proof.
            </p>
          </div>
          <button className="primary-button" type="button" onClick={() => onNavigate('requests')}>
            View help requests
            <ArrowRight size={17} />
          </button>
        </div>

        <div className="path-card path-card--fund">
          <div className="path-card-icon path-card-icon--fund">
            <Landmark size={26} />
          </div>
          <div>
            <h2 className="path-card-title">Fund a campaign</h2>
            <p className="path-card-body">
              Support fundraising campaigns run by verified social workers. Each campaign includes proof of local authority and a transparent financial target.
            </p>
          </div>
          <button className="secondary-button path-card-btn" type="button" onClick={() => onNavigate('campaigns')}>
            View fundraisers
            <ArrowRight size={17} />
          </button>
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <div className="home-section-header">
        <p className="eyebrow"><ClipboardCheck size={14} />How it works</p>
        <h2>From field report to public impact</h2>
      </div>
      <div className="feature-grid">
        <FeatureCard icon={<BadgeCheck size={20} />} title="KYC gate" body="Social workers complete identity verification before they can post anything." />
        <FeatureCard icon={<MapPin size={20} />} title="Local proof" body="Every post includes GPS location, contact details, and authority documents." />
        <FeatureCard icon={<ClipboardCheck size={20} />} title="Admin review" body="Our admins manually review both KYC and each campaign before it goes live." />
        <FeatureCard icon={<Users size={20} />} title="Public action" body="Donors and volunteers see only verified, reviewed help and fundraising posts." />
      </div>

      {/* ── RECENT POSTS ── */}
      <div className="landing-feed">
        <div className="landing-feed-header">
          <p className="eyebrow">Live board</p>
          <h2>Recently approved posts</h2>
          <p className="landing-feed-sub">The latest verified campaigns, approved by our admin team.</p>
          <div className="landing-feed-actions">
            <button className="secondary-button" type="button" onClick={() => onNavigate('requests')}>
              All help requests
            </button>
            <button className="text-button" type="button" onClick={() => onNavigate('campaigns')}>
              All fundraisers
            </button>
          </div>
        </div>
        <RequestList title="" requests={publicRequests.slice(0, 4)} onActionSuccess={onActionSuccess} />
      </div>

      {/* ── STATUS ── */}
      <div className="home-status-row">
        <div className="status-row">
          <span className="status-dot" />
          <span>{apiStatus}</span>
        </div>
      </div>

    </section>
  )
}
