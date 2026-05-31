import { useEffect, useState } from 'react'
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google'

type HealthResponse = {
  status: string
  service: string
}

type GoogleAuthResponse = {
  user: {
    email?: string
    name?: string
    picture?: string
    googleId?: string
  }
}

type AuthMode = 'login' | 'signup'

function App() {
  const [apiStatus, setApiStatus] = useState('Checking API...')
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [authMessage, setAuthMessage] = useState('')

  useEffect(() => {
    fetch('/api/health')
      .then((response) => {
        if (!response.ok) {
          throw new Error('API request failed')
        }

        return response.json() as Promise<HealthResponse>
      })
      .then((data) => setApiStatus(`${data.service}: ${data.status}`))
      .catch(() => setApiStatus('API unavailable'))
  }, [])

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      setAuthMessage('Google did not return a credential. Please try again.')
      return
    }

    try {
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      })

      if (!response.ok) {
        throw new Error('Google verification failed')
      }

      const data = (await response.json()) as GoogleAuthResponse
      const displayName = data.user.name || data.user.email || 'Google user'

      setAuthMessage(
        authMode === 'login'
          ? `Welcome back, ${displayName}.`
          : `Account verified for ${displayName}.`,
      )
    } catch {
      setAuthMessage('Google sign-in worked, but server verification failed.')
    }
  }

  return (
    <main className="app-shell">
      <section className="auth-layout" aria-labelledby="auth-title">
        <div className="auth-copy">
          <p className="eyebrow">UddharSetu</p>
          <h1 id="auth-title">Verified disaster relief starts with trusted access.</h1>
          <p className="lead">
            Sign in with Google to build donor, social worker, and request
            verification workflows on top of this starter app.
          </p>
          <div className="status-row" aria-live="polite">
            <span className="status-dot" />
            <span>{apiStatus}</span>
          </div>
        </div>

        <div className="auth-panel">
          <div className="mode-switch" aria-label="Authentication mode">
            <button
              className={authMode === 'login' ? 'active' : ''}
              type="button"
              onClick={() => {
                setAuthMode('login')
                setAuthMessage('')
              }}
            >
              Login
            </button>
            <button
              className={authMode === 'signup' ? 'active' : ''}
              type="button"
              onClick={() => {
                setAuthMode('signup')
                setAuthMessage('')
              }}
            >
              Sign up
            </button>
          </div>

          <h2>{authMode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
          <p className="panel-copy">
            {authMode === 'login'
              ? 'Continue with your Google account to access UddharSetu.'
              : 'Use your Google account to create an UddharSetu profile.'}
          </p>

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

          {authMessage && (
            <p className="auth-message" role="status">
              {authMessage}
            </p>
          )}
        </div>
      </section>
    </main>
  )
}

export default App
