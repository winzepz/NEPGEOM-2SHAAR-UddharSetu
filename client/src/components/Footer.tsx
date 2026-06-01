import { Mail, MapPin } from 'lucide-react'
import logo from '../assets/logo.svg'
import type { Page } from '../types/app'

type FooterProps = {
  onNavigate: (page: Page) => void
}

const footerLinks: Array<{ label: string; page: Page }> = [
  { label: 'Home', page: 'home' },
  { label: 'Help Requests', page: 'requests' },
  { label: 'Fundraising', page: 'campaigns' },
  { label: 'Dashboard', page: 'worker' },
  { label: 'KYC', page: 'kyc' },
]

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="site-footer">
      <div className="site-footer-main">
        <div className="site-footer-brand">
          <button className="site-footer-logo-button" type="button" onClick={() => onNavigate('home')} aria-label="Go to home">
            <img src={logo} alt="UddharSetu" />
          </button>
          <p>Verified relief posts, transparent fundraising, and field-ready support for communities across Nepal.</p>
        </div>

        <nav className="site-footer-nav" aria-label="Footer navigation">
          <h2>Navigate</h2>
          <div>
            {footerLinks.map((link) => (
              <button key={link.page} type="button" onClick={() => onNavigate(link.page)}>
                {link.label}
              </button>
            ))}
          </div>
        </nav>

        <div className="site-footer-contact">
          <h2>Reach Us</h2>
          <p>
            <MapPin size={15} />
            Kathmandu, Nepal
          </p>
          <p>
            <Mail size={15} />
            support@uddharsetu.org
          </p>
        </div>
      </div>

      <div className="site-footer-bottom">
        <span>© {new Date().getFullYear()} UddharSetu</span>
        <span>Built for verified disaster relief coordination.</span>
      </div>
    </footer>
  )
}
