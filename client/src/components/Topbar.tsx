import { LogOut, Menu, UserRoundCheck, X } from 'lucide-react'
import logo from '../assets/logo.svg'
import { navItems } from '../constants/forms'
import type { AuthMode, AuthUser, Page } from '../types/app'

type TopbarProps = {
  authMode: AuthMode | null
  isMenuOpen: boolean
  page: Page
  user: AuthUser | null
  onAuthOpen: (mode: AuthMode) => void
  onLogout: () => void
  onMenuToggle: () => void
  onNavigate: (page: Page) => void
}

export function Topbar({ isMenuOpen, page, user, onAuthOpen, onLogout, onMenuToggle, onNavigate }: TopbarProps) {
  return (
    <header className="topbar">
      <button className="brand-button" type="button" onClick={() => onNavigate('home')}>
        <img className="brand-logo" src={logo} alt="UddharSetu" />
      </button>

      <button className="menu-button" type="button" onClick={onMenuToggle} aria-label="Toggle menu">
        {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <nav className={isMenuOpen ? 'main-nav open' : 'main-nav'} aria-label="Primary navigation">
        {navItems.map((item) => (
          <button className={page === item.page ? 'active' : ''} key={item.page} type="button" onClick={() => onNavigate(item.page)}>
            {item.label}
          </button>
        ))}
      </nav>

      {user ? (
        <div className="user-menu" aria-label="Authenticated user">
          <span className={`status-badge ${user.status?.toLowerCase()}`}>{user.status}</span>
          <button className="avatar-button" type="button" onClick={() => onNavigate('profile')}>
            {user.picture ? <img src={user.picture} alt="" /> : <UserRoundCheck size={18} />}
            <span>{user.fullName || 'Profile'}</span>
          </button>
          <button className="icon-button" type="button" onClick={onLogout} aria-label="Logout">
            <LogOut size={18} />
          </button>
        </div>
      ) : (
        <div className="auth-actions" aria-label="Authentication">
          <button className="ghost-button" type="button" onClick={() => onAuthOpen('login')}>
            Login
          </button>
          <button className="primary-button compact" type="button" onClick={() => onAuthOpen('signup')}>
            Sign up
          </button>
        </div>
      )}
    </header>
  )
}
