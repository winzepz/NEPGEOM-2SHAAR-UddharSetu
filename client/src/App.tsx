import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
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
  picture?: string | null
  googleId?: string
  role?: string
  status?: 'PENDING' | 'APPROVED' | 'REJECTED'
}

type GoogleAuthResponse = {
  user: AuthUser
}

type HelpRequest = {
  id: string
  title: string
  description: string
  category: string
  urgency: string
  latitude: number
  longitude: number
  localAuthDocUrl: string
  localAuthDocPublicId: string | null
  beneficiaryName: string
  beneficiaryPhone: string
  targetQuantity: number
  fulfilledQuantity: number
  status: string
  reporterName: string
  createdAt: string
}

type HelpRequestsResponse = {
  helpRequests: HelpRequest[]
}

type AuthMode = 'login' | 'signup'
type Section = 'overview' | 'requests' | 'profile'

type RequestForm = {
  title: string
  description: string
  category: string
  urgency: string
  latitude: string
  longitude: string
  localAuthDocUrl: string
  localAuthDocPublicId: string
  beneficiaryName: string
  beneficiaryPhone: string
  targetQuantity: string
}

const initialRequestForm: RequestForm = {
  title: '',
  description: '',
  category: 'FOOD',
  urgency: 'MEDIUM',
  latitude: '',
  longitude: '',
  localAuthDocUrl: '',
  localAuthDocPublicId: '',
  beneficiaryName: '',
  beneficiaryPhone: '',
  targetQuantity: '1',
}

function App() {
  const [apiStatus, setApiStatus] = useState('Checking API...')
  const [authMode, setAuthMode] = useState<AuthMode | null>(null)
  const [authMessage, setAuthMessage] = useState('')
  const [user, setUser] = useState<AuthUser | null>(null)
  const [section, setSection] = useState<Section>('overview')
  const [publicRequests, setPublicRequests] = useState<HelpRequest[]>([])
  const [myRequests, setMyRequests] = useState<HelpRequest[]>([])
  const [requestForm, setRequestForm] = useState<RequestForm>(initialRequestForm)
  const [formMessage, setFormMessage] = useState('')
  const [uploadMessage, setUploadMessage] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const isApproved = user?.status === 'APPROVED'

  const myOpenRequests = useMemo(
    () => myRequests.filter((request) => request.status !== 'FULFILLED').length,
    [myRequests],
  )

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

    loadPublicRequests()
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

  useEffect(() => {
    if (user) {
      loadMyRequests()
    } else {
      setMyRequests([])
      setSection('overview')
    }
  }, [user])

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
          : `Account created for ${displayName}.`,
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

  const handleCreateRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormMessage('')

    try {
      const response = await fetch('/api/help-requests', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...requestForm,
          latitude: Number(requestForm.latitude),
          longitude: Number(requestForm.longitude),
          targetQuantity: Number(requestForm.targetQuantity),
        }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.message || 'Could not create request.')
      }

      setRequestForm(initialRequestForm)
      setFormMessage('Request saved to the database.')
      await Promise.all([loadMyRequests(), loadPublicRequests()])
    } catch (error) {
      setFormMessage(error instanceof Error ? error.message : 'Could not create request.')
    }
  }

  const handleDocumentUpload = async (file: File | undefined) => {
    if (!file) {
      return
    }

    setUploadMessage('')
    setIsUploading(true)

    try {
      const signatureResponse = await fetch('/api/media/upload-signature', {
        method: 'POST',
        credentials: 'include',
      })
      const signatureData = await signatureResponse.json()

      if (!signatureResponse.ok) {
        throw new Error(signatureData.message || 'Could not prepare upload.')
      }

      const uploadForm = new FormData()
      uploadForm.append('file', file)
      uploadForm.append('api_key', signatureData.apiKey)
      uploadForm.append('timestamp', String(signatureData.timestamp))
      uploadForm.append('signature', signatureData.signature)
      uploadForm.append('folder', signatureData.folder)

      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/auto/upload`,
        {
          method: 'POST',
          body: uploadForm,
        },
      )
      const uploadData = await uploadResponse.json()

      if (!uploadResponse.ok) {
        throw new Error(uploadData.error?.message || 'Cloudinary upload failed.')
      }

      setRequestForm((currentForm) => ({
        ...currentForm,
        localAuthDocUrl: uploadData.secure_url,
        localAuthDocPublicId: uploadData.public_id,
      }))
      setUploadMessage('Document uploaded to Cloudinary.')
    } catch (error) {
      setUploadMessage(error instanceof Error ? error.message : 'Upload failed.')
    } finally {
      setIsUploading(false)
    }
  }

  async function loadPublicRequests() {
    const response = await fetch('/api/help-requests')

    if (!response.ok) {
      return
    }

    const data = (await response.json()) as HelpRequestsResponse
    setPublicRequests(data.helpRequests)
  }

  async function loadMyRequests() {
    const response = await fetch('/api/me/help-requests', {
      credentials: 'include',
    })

    if (!response.ok) {
      return
    }

    const data = (await response.json()) as HelpRequestsResponse
    setMyRequests(data.helpRequests)
  }

  const openAuth = (mode: AuthMode) => {
    setAuthMode(mode)
    setAuthMessage('')
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="brand-button" type="button" onClick={() => setSection('overview')}>
          UddharSetu
        </button>

        {user ? (
          <div className="user-menu" aria-label="Authenticated user">
            <span className={`status-badge ${user.status?.toLowerCase()}`}>{user.status}</span>
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

      {user ? (
        <section className="dashboard-shell">
          <aside className="sidebar" aria-label="Dashboard sections">
            <button className={section === 'overview' ? 'active' : ''} type="button" onClick={() => setSection('overview')}>
              Overview
            </button>
            <button className={section === 'requests' ? 'active' : ''} type="button" onClick={() => setSection('requests')}>
              Help requests
            </button>
            <button className={section === 'profile' ? 'active' : ''} type="button" onClick={() => setSection('profile')}>
              Profile
            </button>
          </aside>

          <div className="dashboard-content">
            {section === 'overview' && (
              <section className="page-section">
                <div className="section-heading">
                  <p className="eyebrow">Worker dashboard</p>
                  <h1>{user.fullName || 'Social worker'}</h1>
                  <p className="lead compact-lead">
                    Manage verified relief requests and account access from one place.
                  </p>
                </div>

                <div className="stats-grid">
                  <div>
                    <span>{myRequests.length}</span>
                    <p>Total requests</p>
                  </div>
                  <div>
                    <span>{myOpenRequests}</span>
                    <p>Open requests</p>
                  </div>
                  <div>
                    <span>{user.status}</span>
                    <p>Account status</p>
                  </div>
                </div>

                {!isApproved && (
                  <div className="notice-panel">
                    <strong>Approval required</strong>
                    <p>
                      Your Google account is saved, but request posting is locked until an admin marks this user as approved.
                    </p>
                  </div>
                )}
              </section>
            )}

            {section === 'requests' && (
              <section className="page-section two-column">
                <div>
                  <div className="section-heading">
                    <p className="eyebrow">Request intake</p>
                    <h1>Log a verified need</h1>
                    <p className="lead compact-lead">
                      This writes directly to Neon. No entries appear unless they exist in the database.
                    </p>
                  </div>

                  <form className="request-form" onSubmit={handleCreateRequest}>
                    <label>
                      Title
                      <input
                        required
                        value={requestForm.title}
                        onChange={(event) => setRequestForm({ ...requestForm, title: event.target.value })}
                      />
                    </label>
                    <label>
                      Description
                      <textarea
                        required
                        rows={4}
                        value={requestForm.description}
                        onChange={(event) => setRequestForm({ ...requestForm, description: event.target.value })}
                      />
                    </label>
                    <div className="form-grid">
                      <label>
                        Category
                        <select
                          value={requestForm.category}
                          onChange={(event) => setRequestForm({ ...requestForm, category: event.target.value })}
                        >
                          <option value="FOOD">Food</option>
                          <option value="CLOTHES">Clothes</option>
                          <option value="VOLUNTEER">Volunteer</option>
                          <option value="MONEY">Money</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </label>
                      <label>
                        Urgency
                        <select
                          value={requestForm.urgency}
                          onChange={(event) => setRequestForm({ ...requestForm, urgency: event.target.value })}
                        >
                          <option value="MEDIUM">Medium</option>
                          <option value="HIGH">High</option>
                          <option value="CRITICAL">Critical</option>
                        </select>
                      </label>
                    </div>
                    <div className="form-grid">
                      <label>
                        Latitude
                        <input
                          required
                          type="number"
                          step="any"
                          value={requestForm.latitude}
                          onChange={(event) => setRequestForm({ ...requestForm, latitude: event.target.value })}
                        />
                      </label>
                      <label>
                        Longitude
                        <input
                          required
                          type="number"
                          step="any"
                          value={requestForm.longitude}
                          onChange={(event) => setRequestForm({ ...requestForm, longitude: event.target.value })}
                        />
                      </label>
                    </div>
                    <label>
                      Authority document
                      <input
                        accept="image/*,.pdf"
                        disabled={!isApproved || isUploading}
                        type="file"
                        onChange={(event) => handleDocumentUpload(event.target.files?.[0])}
                      />
                    </label>
                    {requestForm.localAuthDocUrl && (
                      <a className="document-link" href={requestForm.localAuthDocUrl} target="_blank" rel="noreferrer">
                        Uploaded document
                      </a>
                    )}
                    {uploadMessage && <p className="form-message">{uploadMessage}</p>}
                    <div className="form-grid">
                      <label>
                        Beneficiary name
                        <input
                          required
                          value={requestForm.beneficiaryName}
                          onChange={(event) => setRequestForm({ ...requestForm, beneficiaryName: event.target.value })}
                        />
                      </label>
                      <label>
                        Beneficiary phone
                        <input
                          required
                          value={requestForm.beneficiaryPhone}
                          onChange={(event) => setRequestForm({ ...requestForm, beneficiaryPhone: event.target.value })}
                        />
                      </label>
                    </div>
                    <label>
                      Target quantity
                      <input
                        required
                        min="1"
                        type="number"
                        value={requestForm.targetQuantity}
                        onChange={(event) => setRequestForm({ ...requestForm, targetQuantity: event.target.value })}
                      />
                    </label>

                    <button
                      className="primary-button"
                      type="submit"
                      disabled={!isApproved || isUploading || !requestForm.localAuthDocUrl}
                    >
                      Save request
                    </button>
                    {formMessage && <p className="form-message">{formMessage}</p>}
                  </form>
                </div>

                <RequestList title="My database requests" requests={myRequests} />
              </section>
            )}

            {section === 'profile' && (
              <section className="page-section profile-section">
                <div className="section-heading">
                  <p className="eyebrow">Account</p>
                  <h1>User management</h1>
                  <p className="lead compact-lead">
                    This profile is loaded from your authenticated database user.
                  </p>
                </div>
                <div className="profile-panel">
                  {user.picture && <img src={user.picture} alt="" />}
                  <dl>
                    <div>
                      <dt>Name</dt>
                      <dd>{user.fullName || 'Not set'}</dd>
                    </div>
                    <div>
                      <dt>Email</dt>
                      <dd>{user.email || 'Not set'}</dd>
                    </div>
                    <div>
                      <dt>Role</dt>
                      <dd>{user.role}</dd>
                    </div>
                    <div>
                      <dt>Status</dt>
                      <dd>{user.status}</dd>
                    </div>
                    <div>
                      <dt>Database user ID</dt>
                      <dd>{user.id}</dd>
                    </div>
                  </dl>
                </div>
              </section>
            )}
          </div>
        </section>
      ) : (
        <LandingPage
          apiStatus={apiStatus}
          publicRequests={publicRequests}
          onLogin={() => openAuth('login')}
          onSignup={() => openAuth('signup')}
        />
      )}

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
            Google verifies identity, then the Express API stores or loads your user record.
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

function LandingPage({
  apiStatus,
  publicRequests,
  onLogin,
  onSignup,
}: {
  apiStatus: string
  publicRequests: HelpRequest[]
  onLogin: () => void
  onSignup: () => void
}) {
  return (
    <section className="landing-layout" aria-labelledby="landing-title">
      <div className="landing-copy">
        <p className="eyebrow">UddharSetu</p>
        <h1 id="landing-title">Verified disaster relief, from local need to trusted giving.</h1>
        <p className="lead">
          Social workers sign in, verify needs, and publish relief requests that donors can trust.
        </p>
        <div className="cta-row">
          <button className="primary-button" type="button" onClick={onSignup}>
            Sign up with Google
          </button>
          <button className="secondary-button" type="button" onClick={onLogin}>
            Login
          </button>
        </div>
        <div className="status-row" aria-live="polite">
          <span className="status-dot" />
          <span>{apiStatus}</span>
        </div>
      </div>

      <aside className="landing-panel" aria-label="Current platform data">
        <div className="platform-visual">
          <span />
          <span />
          <span />
        </div>
        <div className="data-summary">
          <span>{publicRequests.length}</span>
          <p>Open database requests</p>
        </div>
        <RequestList title="Public request feed" requests={publicRequests} />
      </aside>
    </section>
  )
}

function RequestList({ title, requests }: { title: string; requests: HelpRequest[] }) {
  return (
    <div className="request-list">
      <div className="list-heading">
        <h2>{title}</h2>
        <span>{requests.length}</span>
      </div>
      {requests.length === 0 ? (
        <p className="empty-state">No database records yet.</p>
      ) : (
        <div className="request-items">
          {requests.map((request) => (
            <article className="request-card" key={request.id}>
              <div>
                <strong>{request.title}</strong>
                <p>{request.description}</p>
              </div>
              <dl>
                <div>
                  <dt>Category</dt>
                  <dd>{request.category}</dd>
                </div>
                <div>
                  <dt>Urgency</dt>
                  <dd>{request.urgency}</dd>
                </div>
                <div>
                  <dt>Quantity</dt>
                  <dd>
                    {request.fulfilledQuantity}/{request.targetQuantity}
                  </dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

export default App
