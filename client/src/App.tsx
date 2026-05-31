import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { GoogleLogin, googleLogout, type CredentialResponse } from '@react-oauth/google'
import {
  ArrowRight,
  BadgeCheck,
  ClipboardCheck,
  CloudUpload,
  FileCheck2,
  HeartHandshake,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
  Users,
  X,
} from 'lucide-react'
import logo from './assets/logo.svg'

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
type Page = 'home' | 'requests' | 'campaigns' | 'worker' | 'kyc' | 'admin' | 'profile'

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

type KycForm = {
  organization: string
  phone: string
  district: string
  documentUrl: string
  documentPublicId: string
  notes: string
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

const initialKycForm: KycForm = {
  organization: '',
  phone: '',
  district: '',
  documentUrl: '',
  documentPublicId: '',
  notes: '',
}

const navItems: Array<{ page: Page; label: string }> = [
  { page: 'home', label: 'Home' },
  { page: 'requests', label: 'Requests' },
  { page: 'campaigns', label: 'Campaigns' },
  { page: 'worker', label: 'Worker' },
  { page: 'kyc', label: 'KYC' },
  { page: 'admin', label: 'Admin' },
]

function App() {
  const [apiStatus, setApiStatus] = useState('Checking API...')
  const [authMode, setAuthMode] = useState<AuthMode | null>(null)
  const [authMessage, setAuthMessage] = useState('')
  const [user, setUser] = useState<AuthUser | null>(null)
  const [page, setPage] = useState<Page>('home')
  const [publicRequests, setPublicRequests] = useState<HelpRequest[]>([])
  const [myRequests, setMyRequests] = useState<HelpRequest[]>([])
  const [requestForm, setRequestForm] = useState<RequestForm>(initialRequestForm)
  const [kycForm, setKycForm] = useState<KycForm>(initialKycForm)
  const [formMessage, setFormMessage] = useState('')
  const [kycMessage, setKycMessage] = useState('')
  const [uploadMessage, setUploadMessage] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const isApproved = user?.status === 'APPROVED'
  const isAdmin = user?.role === 'SUPER_ADMIN'

  const myOpenRequests = useMemo(
    () => myRequests.filter((request) => request.status !== 'FULFILLED').length,
    [myRequests],
  )

  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth'
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
      setAuthMessage(authMode === 'login' ? `Welcome back, ${displayName}.` : `Account created for ${displayName}.`)
      setAuthMode(null)
      setPage('worker')
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
    setPage('home')
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

  const handleKycSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setKycMessage('KYC frontend is ready. Backend review storage can be added in the next chunk.')
  }

  const handleDocumentUpload = async (file: File | undefined, target: 'request' | 'kyc') => {
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

      const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${signatureData.cloudName}/auto/upload`, {
        method: 'POST',
        body: uploadForm,
      })
      const uploadData = await uploadResponse.json()

      if (!uploadResponse.ok) {
        throw new Error(uploadData.error?.message || 'Cloudinary upload failed.')
      }

      if (target === 'request') {
        setRequestForm((currentForm) => ({
          ...currentForm,
          localAuthDocUrl: uploadData.secure_url,
          localAuthDocPublicId: uploadData.public_id,
        }))
      } else {
        setKycForm((currentForm) => ({
          ...currentForm,
          documentUrl: uploadData.secure_url,
          documentPublicId: uploadData.public_id,
        }))
      }

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

  const goToPage = (nextPage: Page) => {
    setPage(nextPage)
    setIsMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="brand-button" type="button" onClick={() => goToPage('home')}>
          <img className="brand-logo" src={logo} alt="" />
          UddharSetu
        </button>

        <button className="menu-button" type="button" onClick={() => setIsMenuOpen((open) => !open)} aria-label="Toggle menu">
          {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <nav className={isMenuOpen ? 'main-nav open' : 'main-nav'} aria-label="Primary navigation">
          {navItems.map((item) => (
            <button className={page === item.page ? 'active' : ''} key={item.page} type="button" onClick={() => goToPage(item.page)}>
              {item.label}
            </button>
          ))}
        </nav>

        {user ? (
          <div className="user-menu" aria-label="Authenticated user">
            <span className={`status-badge ${user.status?.toLowerCase()}`}>{user.status}</span>
            <button className="avatar-button" type="button" onClick={() => goToPage('profile')}>
              {user.picture ? <img src={user.picture} alt="" /> : <UserRoundCheck size={18} />}
              <span>{user.fullName || 'Profile'}</span>
            </button>
            <button className="icon-button" type="button" onClick={handleLogout} aria-label="Logout">
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <div className="auth-actions" aria-label="Authentication">
            <button className="ghost-button" type="button" onClick={() => openAuth('login')}>
              Login
            </button>
            <button className="primary-button compact" type="button" onClick={() => openAuth('signup')}>
              Sign up
            </button>
          </div>
        )}
      </header>

      {page === 'home' && (
        <HomePage
          apiStatus={apiStatus}
          publicRequests={publicRequests}
          onLogin={() => openAuth('login')}
          onSignup={() => openAuth('signup')}
          onNavigate={goToPage}
        />
      )}

      {page === 'requests' && <RequestsPage publicRequests={publicRequests} onSignup={() => openAuth('signup')} />}

      {page === 'campaigns' && <CampaignsPage publicRequests={publicRequests} />}

      {page === 'worker' && (
        <WorkerPage
          formMessage={formMessage}
          isApproved={isApproved}
          isUploading={isUploading}
          myOpenRequests={myOpenRequests}
          myRequests={myRequests}
          requestForm={requestForm}
          setRequestForm={setRequestForm}
          uploadMessage={uploadMessage}
          user={user}
          onCreateRequest={handleCreateRequest}
          onDocumentUpload={(file) => handleDocumentUpload(file, 'request')}
          onLogin={() => openAuth('login')}
          onKyc={() => goToPage('kyc')}
        />
      )}

      {page === 'kyc' && (
        <KycPage
          isUploading={isUploading}
          kycForm={kycForm}
          kycMessage={kycMessage}
          setKycForm={setKycForm}
          uploadMessage={uploadMessage}
          user={user}
          onDocumentUpload={(file) => handleDocumentUpload(file, 'kyc')}
          onLogin={() => openAuth('login')}
          onSubmit={handleKycSubmit}
        />
      )}

      {page === 'admin' && <AdminPage isAdmin={isAdmin} publicRequests={publicRequests} user={user} onLogin={() => openAuth('login')} />}

      {page === 'profile' && <ProfilePage myRequests={myRequests} user={user} onLogin={() => openAuth('login')} />}

      {authMode && !user && (
        <section className="auth-panel" aria-labelledby="auth-title">
          <button className="close-button" type="button" onClick={() => setAuthMode(null)} aria-label="Close auth panel">
            <X size={18} />
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

          <p className="auth-note">Google verifies identity, then the Express API stores or loads your user record.</p>
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

function HomePage({
  apiStatus,
  publicRequests,
  onLogin,
  onSignup,
  onNavigate,
}: {
  apiStatus: string
  publicRequests: HelpRequest[]
  onLogin: () => void
  onSignup: () => void
  onNavigate: (page: Page) => void
}) {
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

function RequestsPage({ publicRequests, onSignup }: { publicRequests: HelpRequest[]; onSignup: () => void }) {
  return (
    <section className="content-page page-enter">
      <PageHeader eyebrow="Public portal" title="Open help requests" body="This feed only renders requests returned by the database API." />
      <div className="toolbar">
        <button className="primary-button" type="button" onClick={onSignup}>
          Become a verified worker
        </button>
      </div>
      <RequestList title="Live request feed" requests={publicRequests} />
    </section>
  )
}

function CampaignsPage({ publicRequests }: { publicRequests: HelpRequest[] }) {
  const categories = ['FOOD', 'CLOTHES', 'VOLUNTEER', 'MONEY', 'OTHER']

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

function WorkerPage({
  formMessage,
  isApproved,
  isUploading,
  myOpenRequests,
  myRequests,
  requestForm,
  setRequestForm,
  uploadMessage,
  user,
  onCreateRequest,
  onDocumentUpload,
  onLogin,
  onKyc,
}: {
  formMessage: string
  isApproved: boolean
  isUploading: boolean
  myOpenRequests: number
  myRequests: HelpRequest[]
  requestForm: RequestForm
  setRequestForm: (form: RequestForm) => void
  uploadMessage: string
  user: AuthUser | null
  onCreateRequest: (event: FormEvent<HTMLFormElement>) => void
  onDocumentUpload: (file: File | undefined) => void
  onLogin: () => void
  onKyc: () => void
}) {
  if (!user) {
    return <LockedPage title="Worker console" body="Login with Google to access the worker dashboard." onLogin={onLogin} />
  }

  return (
    <section className="content-page page-enter">
      <PageHeader eyebrow="Worker console" title="Create verified help requests" body="Upload proof, record beneficiary details, and publish only after approval." />

      <div className="stats-grid">
        <StatCard label="Total requests" value={myRequests.length} />
        <StatCard label="Open requests" value={myOpenRequests} />
        <StatCard label="Account status" value={user.status || 'PENDING'} />
      </div>

      {!isApproved && (
        <div className="notice-panel">
          <strong>Approval required</strong>
          <p>Your account exists, but request posting stays locked until an admin approves your worker profile.</p>
          <button className="secondary-button" type="button" onClick={onKyc}>
            Complete KYC
          </button>
        </div>
      )}

      <section className="split-panel">
        <RequestFormPanel
          formMessage={formMessage}
          isApproved={isApproved}
          isUploading={isUploading}
          requestForm={requestForm}
          setRequestForm={setRequestForm}
          uploadMessage={uploadMessage}
          onCreateRequest={onCreateRequest}
          onDocumentUpload={onDocumentUpload}
        />
        <RequestList title="My database requests" requests={myRequests} />
      </section>
    </section>
  )
}

function RequestFormPanel({
  formMessage,
  isApproved,
  isUploading,
  requestForm,
  setRequestForm,
  uploadMessage,
  onCreateRequest,
  onDocumentUpload,
}: {
  formMessage: string
  isApproved: boolean
  isUploading: boolean
  requestForm: RequestForm
  setRequestForm: (form: RequestForm) => void
  uploadMessage: string
  onCreateRequest: (event: FormEvent<HTMLFormElement>) => void
  onDocumentUpload: (file: File | undefined) => void
}) {
  return (
    <form className="form-panel" onSubmit={onCreateRequest}>
      <h2>Request intake</h2>
      <label>
        Title
        <input required value={requestForm.title} onChange={(event) => setRequestForm({ ...requestForm, title: event.target.value })} />
      </label>
      <label>
        Description
        <textarea required rows={4} value={requestForm.description} onChange={(event) => setRequestForm({ ...requestForm, description: event.target.value })} />
      </label>
      <div className="form-grid">
        <label>
          Category
          <select value={requestForm.category} onChange={(event) => setRequestForm({ ...requestForm, category: event.target.value })}>
            <option value="FOOD">Food</option>
            <option value="CLOTHES">Clothes</option>
            <option value="VOLUNTEER">Volunteer</option>
            <option value="MONEY">Money</option>
            <option value="OTHER">Other</option>
          </select>
        </label>
        <label>
          Urgency
          <select value={requestForm.urgency} onChange={(event) => setRequestForm({ ...requestForm, urgency: event.target.value })}>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </label>
      </div>
      <div className="form-grid">
        <label>
          Latitude
          <input required type="number" step="any" value={requestForm.latitude} onChange={(event) => setRequestForm({ ...requestForm, latitude: event.target.value })} />
        </label>
        <label>
          Longitude
          <input required type="number" step="any" value={requestForm.longitude} onChange={(event) => setRequestForm({ ...requestForm, longitude: event.target.value })} />
        </label>
      </div>
      <label>
        Authority document
        <input accept="image/*,.pdf" disabled={!isApproved || isUploading} type="file" onChange={(event) => onDocumentUpload(event.target.files?.[0])} />
      </label>
      {requestForm.localAuthDocUrl && (
        <a className="document-link" href={requestForm.localAuthDocUrl} target="_blank" rel="noreferrer">
          <FileCheck2 size={16} />
          Uploaded document
        </a>
      )}
      {uploadMessage && <p className="form-message">{uploadMessage}</p>}
      <div className="form-grid">
        <label>
          Beneficiary name
          <input required value={requestForm.beneficiaryName} onChange={(event) => setRequestForm({ ...requestForm, beneficiaryName: event.target.value })} />
        </label>
        <label>
          Beneficiary phone
          <input required value={requestForm.beneficiaryPhone} onChange={(event) => setRequestForm({ ...requestForm, beneficiaryPhone: event.target.value })} />
        </label>
      </div>
      <label>
        Target quantity
        <input required min="1" type="number" value={requestForm.targetQuantity} onChange={(event) => setRequestForm({ ...requestForm, targetQuantity: event.target.value })} />
      </label>
      <button className="primary-button" type="submit" disabled={!isApproved || isUploading || !requestForm.localAuthDocUrl}>
        Save request
      </button>
      {formMessage && <p className="form-message">{formMessage}</p>}
    </form>
  )
}

function KycPage({
  isUploading,
  kycForm,
  kycMessage,
  setKycForm,
  uploadMessage,
  user,
  onDocumentUpload,
  onLogin,
  onSubmit,
}: {
  isUploading: boolean
  kycForm: KycForm
  kycMessage: string
  setKycForm: (form: KycForm) => void
  uploadMessage: string
  user: AuthUser | null
  onDocumentUpload: (file: File | undefined) => void
  onLogin: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  if (!user) {
    return <LockedPage title="KYC" body="Login to prepare your worker verification details." onLogin={onLogin} />
  }

  return (
    <section className="content-page narrow-page page-enter">
      <PageHeader eyebrow="KYC" title="Worker verification" body="A clean frontend flow for social worker review. Storage for KYC submissions can be added next." />
      <form className="form-panel" onSubmit={onSubmit}>
        <label>
          Organization
          <input required value={kycForm.organization} onChange={(event) => setKycForm({ ...kycForm, organization: event.target.value })} />
        </label>
        <div className="form-grid">
          <label>
            Phone
            <input required value={kycForm.phone} onChange={(event) => setKycForm({ ...kycForm, phone: event.target.value })} />
          </label>
          <label>
            District
            <input required value={kycForm.district} onChange={(event) => setKycForm({ ...kycForm, district: event.target.value })} />
          </label>
        </div>
        <label>
          Verification document
          <input accept="image/*,.pdf" disabled={isUploading} type="file" onChange={(event) => onDocumentUpload(event.target.files?.[0])} />
        </label>
        {kycForm.documentUrl && (
          <a className="document-link" href={kycForm.documentUrl} target="_blank" rel="noreferrer">
            <FileCheck2 size={16} />
            Uploaded KYC document
          </a>
        )}
        {uploadMessage && <p className="form-message">{uploadMessage}</p>}
        <label>
          Notes
          <textarea rows={4} value={kycForm.notes} onChange={(event) => setKycForm({ ...kycForm, notes: event.target.value })} />
        </label>
        <button className="primary-button" type="submit">
          Submit KYC
        </button>
        {kycMessage && <p className="form-message">{kycMessage}</p>}
      </form>
    </section>
  )
}

function AdminPage({
  isAdmin,
  publicRequests,
  user,
  onLogin,
}: {
  isAdmin: boolean
  publicRequests: HelpRequest[]
  user: AuthUser | null
  onLogin: () => void
}) {
  if (!user) {
    return <LockedPage title="Admin review" body="Login to access admin review screens." onLogin={onLogin} />
  }

  return (
    <section className="content-page page-enter">
      <PageHeader eyebrow="Admin panel" title="Review center" body="Frontend for worker approval, request review, and moderation workflows." />
      {!isAdmin && (
        <div className="notice-panel">
          <strong>Admin-only area</strong>
          <p>Your account is not marked as SUPER_ADMIN. The review UI is visible, but approval actions should stay locked until backend admin permissions are added.</p>
        </div>
      )}
      <div className="admin-grid">
        <ReviewColumn title="Pending workers" icon={<UserRoundCheck size={20} />} />
        <ReviewColumn title="KYC documents" icon={<FileCheck2 size={20} />} />
        <div className="review-column">
          <div className="review-heading">
            <MapPin size={20} />
            <h2>Active requests</h2>
          </div>
          {publicRequests.length === 0 ? <p className="empty-state">No active database requests.</p> : <RequestList title="Requests to monitor" requests={publicRequests} />}
        </div>
      </div>
    </section>
  )
}

function ProfilePage({ myRequests, user, onLogin }: { myRequests: HelpRequest[]; user: AuthUser | null; onLogin: () => void }) {
  if (!user) {
    return <LockedPage title="Profile" body="Login to view your saved user record." onLogin={onLogin} />
  }

  return (
    <section className="content-page narrow-page page-enter">
      <PageHeader eyebrow="Account" title="User management" body="This profile is loaded from your authenticated database user." />
      <div className="profile-panel">
        {user.picture && <img src={user.picture} alt="" />}
        <dl>
          <InfoRow label="Name" value={user.fullName || 'Not set'} />
          <InfoRow label="Email" value={user.email || 'Not set'} />
          <InfoRow label="Role" value={user.role || 'SOCIAL_WORKER'} />
          <InfoRow label="Status" value={user.status || 'PENDING'} />
          <InfoRow label="Database user ID" value={user.id} />
          <InfoRow label="Saved requests" value={String(myRequests.length)} />
        </dl>
      </div>
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
                <InfoRow label="Category" value={request.category} />
                <InfoRow label="Urgency" value={request.urgency} />
                <InfoRow label="Quantity" value={`${request.fulfilledQuantity}/${request.targetQuantity}`} />
              </dl>
              {request.localAuthDocUrl && (
                <a className="document-link" href={request.localAuthDocUrl} target="_blank" rel="noreferrer">
                  <FileCheck2 size={16} />
                  Authority document
                </a>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

function PageHeader({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <div className="page-header">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p className="lead compact-lead">{body}</p>
    </div>
  )
}

function FeatureCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <article className="feature-card">
      <div className="feature-icon">{icon}</div>
      <h2>{title}</h2>
      <p>{body}</p>
    </article>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <span>{value}</span>
      <p>{label}</p>
    </div>
  )
}

function ReviewColumn({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="review-column">
      <div className="review-heading">
        {icon}
        <h2>{title}</h2>
      </div>
      <p className="empty-state">No database records yet.</p>
    </div>
  )
}

function LockedPage({ body, onLogin, title }: { body: string; onLogin: () => void; title: string }) {
  return (
    <section className="content-page narrow-page page-enter">
      <PageHeader eyebrow="Access required" title={title} body={body} />
      <button className="primary-button" type="button" onClick={onLogin}>
        Login with Google
      </button>
    </section>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

export default App
