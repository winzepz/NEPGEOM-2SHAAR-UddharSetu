import { useEffect, useState } from 'react'
import { GoogleLogin, googleLogout, type CredentialResponse } from '@react-oauth/google'

type HealthResponse = {
  status: string
  service: string
  database?: string
}

type AuthUser = {
  id: string
  email?: string
  fullName?: string
  picture?: string
  googleId?: string
  role?: string
  status?: string
}

type GoogleAuthResponse = {
  user: AuthUser
}

type AuthMode = 'login' | 'signup'

function App() {
  const [apiStatus, setApiStatus] = useState('Checking API...')
  const [authMode, setAuthMode] = useState<AuthMode | null>(null)
  const [authMessage, setAuthMessage] = useState('')
  const [user, setUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    fetch('/api/health')
      .then((response) => {
        if (!response.ok) {
          throw new Error('API request failed')
        }

        return response.json() as Promise<HealthResponse>
      })
      .then((data) =>
        setApiStatus(
          data.database
            ? `${data.service}: ${data.status}, database ${data.database}`
            : `${data.service}: ${data.status}`,
        ),
      )
      .catch(() => setApiStatus('API unavailable'))
  }, [])

  useEffect(() => {
    fetch('/api/auth/me', {
      credentials: 'include',
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Not authenticated')
        }

        return response.json() as Promise<GoogleAuthResponse>
      })
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
  }, [])

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      setAuthMessage('Google did not return a credential. Please try again.')
      return
    }

    try {
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      })

      if (!response.ok) {
        throw new Error('Google verification failed')
      }

      const data = (await response.json()) as GoogleAuthResponse
      const displayName = data.user.fullName || data.user.email || 'Google user'

      setUser(data.user)
      setAuthMessage(
        authMode === 'login'
          ? `Welcome back, ${displayName}.`
          : `Account verified for ${displayName}.`,
      )
      setAuthMode(null)
    } catch {
      setAuthMessage('Google sign-in worked, but server verification failed.')
    }
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    }).catch(() => undefined)
    googleLogout()
    setUser(null)
    setAuthMode(null)
    setAuthMessage('')
  }

  const openAuth = (mode: AuthMode) => {
    setAuthMode(mode)
    setAuthMessage('')
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <span className="brand">UddharSetu</span>
        {user ? (
          <div className="user-menu" aria-label="Authenticated user">
            <span className="user-id">User ID: {user.id}</span>
            <button className="ghost-button" type="button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        ) : (
          <nav className="auth-actions" aria-label="Authentication">
            <button className="ghost-button" type="button" onClick={() => openAuth('login')}>
              Login
            </button>
            <button className="primary-button compact" type="button" onClick={() => openAuth('signup')}>
              Sign up
            </button>
          </nav>
        )}
      </header>

      <section className="landing-layout" aria-labelledby="landing-title">
        <div className="landing-copy">
          <p className="eyebrow">UddharSetu</p>
          <h1 id="landing-title">Verified disaster relief, from local need to trusted giving.</h1>
          <p className="lead">
            Connect victims, social workers, and donors through requests that can
            be checked before help is sent.
          </p>
          {!user && (
            <div className="cta-row">
              <button className="primary-button" type="button" onClick={() => openAuth('signup')}>
                Sign up with Google
              </button>
              <button className="secondary-button" type="button" onClick={() => openAuth('login')}>
                Login
              </button>
            </div>
          )}
          <div className="status-row" aria-live="polite">
            <span className="status-dot" />
            <span>{apiStatus}</span>
          </div>
        </div>

        <aside className="relief-panel" aria-label="Platform highlights">
          <div>
            <span className="metric">24h</span>
            <p>Urgent needs can be posted and reviewed quickly.</p>
          </div>
          <div>
            <span className="metric">3 roles</span>
            <p>Victims, social workers, and donors share one verified flow.</p>
          </div>
          <div>
            <span className="metric">Google</span>
            <p>Login is verified by the API and saved in your user database.</p>
          </div>
        </aside>
      </section>

      {authMode && !user && (
        <section className="auth-panel" aria-labelledby="auth-title">
          <button className="close-button" type="button" onClick={() => setAuthMode(null)} aria-label="Close auth panel">
            x
          </button>
          <h2 id="auth-title">{authMode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
          <p className="panel-copy">Continue securely with your Google account.</p>

          <div className="google-button-wrap">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setAuthMessage('Google authentication failed.')}
              text={authMode === 'login' ? 'signin_with' : 'signup_with'}
              shape="rectangular"
              size="large"
              width="100%"
            />
          </div>

          <p className="auth-note">
            Your Google token is verified by the Express API. The app receives
            only your saved user profile.
          </p>
        </section>
      )}

      {authMessage && (
        <p className="auth-message" role="status">
          {authMessage}
        </p>
      )}
    </main>
  )
}

export default App
