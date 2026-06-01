import {
  ArrowRight,
  BadgeCheck,
  CircleDollarSign,
  ClipboardCheck,
  HandHeart,
  Landmark,
  MapPin,
  Users,
} from 'lucide-react'
import type { AuthUser, Page, ReliefPost } from '../types/app'
import { FeatureCard } from '../components/FeatureCard'
import { RequestList } from '../components/RequestList'
import heroImage from '../assets/Landingpageimage.jpg'
import heroVideo from '../assets/LANDING VIDEO.webm'

type HomePageProps = {
  publicRequests: ReliefPost[]
  user: AuthUser | null
  onLogin: () => void
  onNavigate: (page: Page) => void
  onActionSuccess?: () => void
  onOpenPost?: (post: ReliefPost) => void
}

export function HomePage({ publicRequests, user, onLogin, onNavigate, onActionSuccess, onOpenPost }: HomePageProps) {
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
        ? 'Go to Dashboard'
        : 'Complete KYC'

  return (
    <section className="home-page page-enter">

      {/* ── HERO ── */}
      <div className="home-hero">
        <div className="home-hero-inner">
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
        <div className="home-hero-visual">
          <video
            className="hero-photo"
            src={heroVideo}
            poster={heroImage}
            autoPlay
            muted
            loop
            playsInline
            aria-label="Disaster relief and community support"
            onError={(e) => {
              e.currentTarget.classList.add('hero-photo--failed')
            }}
          >
            <img src={heroImage} alt="Disaster relief and community support" />
          </video>
          <div className="hero-photo-overlay" />

          {/* Floating campaign card */}
          <div className="hero-photo-card">
            <div className="hero-photo-card-head">
              <span className="hero-mini-type">
                <CircleDollarSign size={11} />
                Fundraiser
              </span>
              <span className="hero-mini-pct hero-mini-pct--fund">62%</span>
            </div>
            <div className="hero-photo-card-title">Flood Relief — Sindhupalchok</div>
            <div className="hero-mini-bar">
              <span className="hero-mini-fill--fund" style={{ width: '62%' }} />
            </div>
            <div className="hero-photo-card-sub">Rs. 62,000 raised of Rs. 1,00,000 goal</div>
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
        <RequestList title="" requests={publicRequests.slice(0, 4)} onActionSuccess={onActionSuccess} onOpenPost={onOpenPost} />
      </div>

      {/* ── STATUS ── */}
    </section>
  )
}
