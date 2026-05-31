import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { googleLogout, type CredentialResponse } from '@react-oauth/google'
import { AuthPanel } from './components/AuthPanel'
import { Topbar } from './components/Topbar'
import { initialKycForm, initialRequestForm } from './constants/forms'
import { AdminPage } from './pages/AdminPage'
import { CampaignsPage } from './pages/CampaignsPage'
import { HomePage } from './pages/HomePage'
import { KycPage } from './pages/KycPage'
import { ProfilePage } from './pages/ProfilePage'
import { RequestsPage } from './pages/RequestsPage'
import { WorkerPage } from './pages/WorkerPage'
import type {
  AuthMode,
  AuthUser,
  GoogleAuthResponse,
  HealthResponse,
  HelpRequest,
  HelpRequestsResponse,
  KycForm,
  Page,
  RequestForm,
} from './types/app'

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
      <Topbar
        authMode={authMode}
        isMenuOpen={isMenuOpen}
        page={page}
        user={user}
        onAuthOpen={openAuth}
        onLogout={handleLogout}
        onMenuToggle={() => setIsMenuOpen((open) => !open)}
        onNavigate={goToPage}
      />

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
        <AuthPanel
          authMode={authMode}
          onClose={() => setAuthMode(null)}
          onError={() => setAuthMessage('Google authentication failed.')}
          onSuccess={handleGoogleSuccess}
        />
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
