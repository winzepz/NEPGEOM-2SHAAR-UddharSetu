import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { googleLogout, type CredentialResponse } from '@react-oauth/google'
import { AuthPanel } from './components/AuthPanel'
import { Footer } from './components/Footer'
import { Topbar } from './components/Topbar'
import { initialKycForm, initialRequestForm } from './constants/forms'
import { AdminPage } from './pages/AdminPage'
import { CampaignsPage } from './pages/CampaignsPage'
import { HomePage } from './pages/HomePage'
import { KycPage } from './pages/KycPage'
import { PostDetailPage } from './pages/PostDetailPage'
import { ProfilePage } from './pages/ProfilePage'
import { RequestsPage } from './pages/RequestsPage'
import { WorkerPage } from './pages/WorkerPage'
import type {
  AuthMode,
  AuthUser,
  GoogleAuthResponse,
  KycSubmission,
  KycSubmissionsResponse,
  KycForm,
  Page,
  PostsResponse,
  ReliefPost,
  RequestForm,
} from './types/app'

type ViewerLocation = {
  latitude: number
  longitude: number
}

function getDistanceKm(from: ViewerLocation, post: ReliefPost) {
  const earthRadiusKm = 6371
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180
  const lat1 = toRadians(from.latitude)
  const lat2 = toRadians(post.latitude)
  const deltaLat = toRadians(post.latitude - from.latitude)
  const deltaLng = toRadians(post.longitude - from.longitude)
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2)

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function App() {
  const [authMode, setAuthMode] = useState<AuthMode | null>(null)
  const [authMessage, setAuthMessage] = useState('')
  const [user, setUser] = useState<AuthUser | null>(null)
  const [page, setPage] = useState<Page>('home')
  const [publicRequests, setPublicRequests] = useState<ReliefPost[]>([])
  const [myRequests, setMyRequests] = useState<ReliefPost[]>([])
  const [reviewPosts, setReviewPosts] = useState<ReliefPost[]>([])
  const [kycSubmissions, setKycSubmissions] = useState<KycSubmission[]>([])
  const [kycSubmission, setKycSubmission] = useState<KycSubmission | null>(null)
  const [requestForm, setRequestForm] = useState<RequestForm>(initialRequestForm)
  const [kycForm, setKycForm] = useState<KycForm>(initialKycForm)
  const [formMessage, setFormMessage] = useState('')
  const [kycMessage, setKycMessage] = useState('')
  const [uploadMessages, setUploadMessages] = useState({
    requestImage: '',
    request: '',
    kycPhoto: '',
    kycDocument: '',
  })
  const [kycSubmitted, setKycSubmitted] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)
  const [detailReturnPage, setDetailReturnPage] = useState<Page>('home')
  const [viewerLocation, setViewerLocation] = useState<ViewerLocation | null>(null)
  const isApproved = user?.status === 'APPROVED'
  const isAdmin = user?.role === 'SUPER_ADMIN'

  const nearestPublicRequests = useMemo(() => {
    if (!viewerLocation) {
      return publicRequests
    }

    return publicRequests
      .map((post, index) => ({
        post,
        index,
        distance: getDistanceKm(viewerLocation, post),
      }))
      .sort((a, b) => a.distance - b.distance || a.index - b.index)
      .map(({ post }) => post)
  }, [publicRequests, viewerLocation])

  // Re-derive the detail post from live data so progress stays fresh after a donation refresh
  const detailPost = useMemo(
    () => [...publicRequests, ...myRequests].find((p) => p.id === selectedPostId) ?? null,
    [publicRequests, myRequests, selectedPostId],
  )

  const openPost = (post: ReliefPost) => {
    setSelectedPostId(post.id)
    setDetailReturnPage(page === 'detail' ? detailReturnPage : page)
    setPage('detail')
    setIsMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const myOpenRequests = useMemo(
    () => myRequests.filter((request) => request.reviewStatus === 'APPROVED').length,
    [myRequests],
  )

  const fetchMyKyc = async () => {
    try {
      const res = await fetch('/api/kyc/me', { credentials: 'include' })
      if (res.ok) {
        const data = (await res.json()) as { submission: KycSubmission | null }
        setKycSubmission(data.submission)
      }
    } catch (error) {
      console.error('Failed to fetch KYC:', error)
    }
  }

  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth'
    loadPublicPosts()

    navigator.geolocation?.getCurrentPosition(
      (position) => {
        setViewerLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
      },
      () => undefined,
      { enableHighAccuracy: true, maximumAge: 300000, timeout: 10000 },
    )

    // Handle Khalti payment callback
    const params = new URLSearchParams(window.location.search)
    const pidx = params.get('pidx')
    const khaltiStatus = params.get('status')
    if (pidx) {
      window.history.replaceState({}, document.title, window.location.pathname)

      if (khaltiStatus && khaltiStatus !== 'Completed') {
        // User cancelled or payment failed on Khalti side — no need to call verify
        setAuthMessage(
          khaltiStatus === 'User canceled'
            ? 'Payment was cancelled. No charge was made.'
            : `Payment did not complete (${khaltiStatus}).`
        )
        return
      }

      setAuthMessage('Verifying your donation…')
      fetch('/api/donations/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pidx }),
      })
        .then(async (res) => {
          const data = (await res.json().catch(() => ({}))) as {
            message?: string
            campaignTitle?: string
            amountNPR?: number
          }
          if (res.ok && data.amountNPR) {
            setAuthMessage(
              `✓ Donation of Rs. ${data.amountNPR.toLocaleString()} received for "${data.campaignTitle}". Thank you!`
            )
          } else if (res.ok) {
            setAuthMessage('Thank you! Your donation was received successfully.')
          } else {
            setAuthMessage(data.message || 'Donation verification failed. Please contact support.')
          }
          loadPublicPosts()
        })
        .catch(() => {
          setAuthMessage('Network error while verifying payment. Please contact support if you were charged.')
        })
    }
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
      .then((data) => {
        setUser(data.user)
        if (data.user.role === 'SUPER_ADMIN') {
          setPage('admin')
        }
      })
      .catch(() => setUser(null))
  }, [])

  useEffect(() => {
    if (user) {
      if (user.role === 'SUPER_ADMIN') {
        setMyRequests([])
        setKycSubmission(null)
        setKycSubmitted(false)
        loadAdminReviewData()
      } else {
        loadMyPosts()
        fetchMyKyc()
      }
    } else {
      setMyRequests([])
      setKycSubmission(null)
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
        const errorData = (await response.json().catch(() => ({}))) as { message?: string }
        throw new Error(errorData.message || 'Google verification failed')
      }

      const data = (await response.json()) as GoogleAuthResponse
      const displayName = data.user.fullName || data.user.email || 'Google user'

      setUser(data.user)
      setAuthMessage(authMode === 'login' ? `Welcome back, ${displayName}.` : `Account created for ${displayName}.`)
      setAuthMode(null)
      if (data.user.role === 'SUPER_ADMIN') {
        setKycSubmission(null)
        setPage('admin')
      } else {
        await fetchMyKyc()
        setPage(data.user.status === 'APPROVED' ? 'worker' : 'kyc')
      }
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : 'Google sign-in worked, but server verification failed.')
    }
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    }).catch(() => undefined)
    googleLogout()
    setUser(null)
    setKycSubmission(null)
    setAuthMode(null)
    setAuthMessage('')
    setPage('home')
  }

  const handleCreateRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormMessage('')

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...requestForm,
          latitude: Number(requestForm.latitude),
          longitude: Number(requestForm.longitude),
          imageUrl: requestForm.imageUrl,
          imagePublicId: requestForm.imagePublicId,
          targetQuantity: Number(requestForm.targetQuantity),
          targetAmount: Number(requestForm.targetAmount),
        }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.message || 'Could not create request.')
      }

      setRequestForm(initialRequestForm)
      setUploadMessages((currentMessages) => ({ ...currentMessages, request: '', requestImage: '' }))
      setFormMessage('Your post was submitted for review.')
      await Promise.all([loadMyPosts(), loadPublicPosts()])
    } catch (error) {
      setFormMessage(error instanceof Error ? error.message : 'Could not create request.')
    }
  }

  const handleKycSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setKycMessage('')

    try {
      const response = await fetch('/api/kyc', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(kycForm),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.message || 'Could not submit KYC.')
      }

      setKycSubmitted(true)
      setUser((currentUser) => (currentUser ? { ...currentUser, status: 'PENDING' } : currentUser))
      setKycMessage('Your KYC has been submitted for review.')
      await fetchMyKyc()
    } catch (error) {
      setKycMessage(error instanceof Error ? error.message : 'Could not submit KYC.')
    }
  }

  const handleDocumentUpload = async (
    file: File | undefined,
    target: 'request-image' | 'request' | 'kyc-photo' | 'kyc-document',
  ) => {
    if (!file) {
      return
    }

    const messageKey =
      target === 'request-image' ? 'requestImage' : target === 'request' ? 'request' : target === 'kyc-photo' ? 'kycPhoto' : 'kycDocument'
    setUploadMessages((currentMessages) => ({ ...currentMessages, [messageKey]: '' }))
    setIsUploading(true)

    try {
      const signatureResponse = await fetch('/api/media/upload-signature', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ purpose: target === 'request-image' ? 'post-images' : target === 'request' ? 'post-documents' : 'kyc' }),
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
        throw new Error(uploadData.error?.message || 'Upload failed. Please try again.')
      }

      if (target === 'request-image') {
        setRequestForm((currentForm) => ({
          ...currentForm,
          imageUrl: uploadData.secure_url,
          imagePublicId: uploadData.public_id,
        }))
      } else if (target === 'request') {
        setRequestForm((currentForm) => ({
          ...currentForm,
          authorityDocumentUrl: uploadData.secure_url,
          authorityDocumentPublicId: uploadData.public_id,
        }))
      } else if (target === 'kyc-photo') {
        setKycForm((currentForm) => ({
          ...currentForm,
          photoUrl: uploadData.secure_url,
          photoPublicId: uploadData.public_id,
        }))
      } else {
        setKycForm((currentForm) => ({
          ...currentForm,
          governmentDocumentUrl: uploadData.secure_url,
          governmentDocumentPublicId: uploadData.public_id,
        }))
      }

      setUploadMessages((currentMessages) => ({
        ...currentMessages,
        [messageKey]:
          target === 'kyc-photo'
            ? 'Profile photo uploaded successfully.'
            : target === 'kyc-document'
              ? 'Government document uploaded successfully.'
              : target === 'request-image'
                ? 'Post image uploaded successfully.'
              : 'Authority document uploaded successfully.',
      }))
    } catch (error) {
      setUploadMessages((currentMessages) => ({
        ...currentMessages,
        [messageKey]: error instanceof Error ? error.message : 'Upload failed. Please try again.',
      }))
    } finally {
      setIsUploading(false)
    }
  }

  async function loadPublicPosts() {
    const response = await fetch('/api/posts')

    if (!response.ok) {
      return
    }

    const data = (await response.json()) as PostsResponse
    setPublicRequests(data.posts)
  }

  async function loadMyPosts() {
    const response = await fetch('/api/me/posts', {
      credentials: 'include',
    })

    if (!response.ok) {
      return
    }

    const data = (await response.json()) as PostsResponse
    setMyRequests(data.posts)
  }

  async function loadAdminReviewData() {
    const [kycResponse, postsResponse] = await Promise.all([
      fetch('/api/admin/kyc', { credentials: 'include' }),
      fetch('/api/admin/posts', { credentials: 'include' }),
    ])

    if (kycResponse.ok) {
      const data = (await kycResponse.json()) as KycSubmissionsResponse
      setKycSubmissions(data.submissions)
    }

    if (postsResponse.ok) {
      const data = (await postsResponse.json()) as PostsResponse
      setReviewPosts(data.posts)
    }
  }

  async function handleAdminReview(kind: 'kyc' | 'post', id: string, status: 'APPROVED' | 'REJECTED', adminNotes?: string) {
    const endpoint = kind === 'kyc' ? `/api/admin/kyc/${id}/review` : `/api/admin/posts/${id}/review`
    const response = await fetch(endpoint, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status, adminNotes }),
    })

    if (response.ok) {
      await Promise.all([loadAdminReviewData(), loadPublicPosts()])
    }
  }

  // Auto-dismiss auth messages after 7 seconds
  useEffect(() => {
    if (!authMessage) return
    const timer = setTimeout(() => setAuthMessage(''), 7000)
    return () => clearTimeout(timer)
  }, [authMessage])

  const openAuth = (mode: AuthMode) => {
    setAuthMode(mode)
    setAuthMessage('')
  }

  const goToPage = (nextPage: Page) => {
    if (user?.role === 'SUPER_ADMIN' && nextPage !== 'home' && nextPage !== 'admin') {
      setPage('admin')
      setIsMenuOpen(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    if (nextPage === 'admin' && user?.role !== 'SUPER_ADMIN') {
      return
    }

    if (nextPage === 'worker' && user && user.status !== 'APPROVED') {
      setPage('kyc')
      setKycMessage(
        user.status === 'REJECTED'
          ? 'Your verification needs attention before you can create posts.'
          : kycSubmitted
            ? 'Your KYC is pending. Posting unlocks after approval.'
            : 'Complete KYC to create help requests or fundraising campaigns.',
      )
      setIsMenuOpen(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

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
          publicRequests={nearestPublicRequests}
          user={user}
          onLogin={() => openAuth('login')}
          onNavigate={goToPage}
          onActionSuccess={loadPublicPosts}
          onOpenPost={openPost}
        />
      )}

      {page === 'requests' && (
        <RequestsPage
          publicRequests={nearestPublicRequests}
          onLogin={() => openAuth('login')}
          onNavigate={goToPage}
          onActionSuccess={loadPublicPosts}
          onOpenPost={openPost}
        />
      )}
      {page === 'campaigns' && (
        <CampaignsPage
          publicRequests={nearestPublicRequests}
          onNavigate={goToPage}
          onActionSuccess={loadPublicPosts}
          onOpenPost={openPost}
        />
      )}
      {page === 'detail' && (
        <PostDetailPage
          post={detailPost}
          onBack={() => goToPage(detailReturnPage)}
          onActionSuccess={loadPublicPosts}
        />
      )}
      {page === 'worker' && (
        <WorkerPage
          formMessage={formMessage}
          isApproved={isApproved}
          isUploading={isUploading}
          myOpenRequests={myOpenRequests}
          myRequests={myRequests}
          requestForm={requestForm}
          setRequestForm={setRequestForm}
          uploadMessage={uploadMessages.request}
          imageUploadMessage={uploadMessages.requestImage}
          user={user}
          onCreateRequest={handleCreateRequest}
          onImageUpload={(file) => handleDocumentUpload(file, 'request-image')}
          onDocumentUpload={(file) => handleDocumentUpload(file, 'request')}
          onLogin={() => openAuth('login')}
          onKyc={() => goToPage('kyc')}
          onActionSuccess={loadPublicPosts}
        />
      )}
      {page === 'kyc' && (
        <KycPage
          isUploading={isUploading}
          kycForm={kycForm}
          kycMessage={kycMessage}
          photoUploadMessage={uploadMessages.kycPhoto}
          setKycForm={setKycForm}
          documentUploadMessage={uploadMessages.kycDocument}
          user={user}
          onPhotoUpload={(file) => handleDocumentUpload(file, 'kyc-photo')}
          onDocumentUpload={(file) => handleDocumentUpload(file, 'kyc-document')}
          onLogin={() => openAuth('login')}
          onCampaigns={() => goToPage('campaigns')}
          onWorker={() => goToPage('worker')}
          onSubmit={handleKycSubmit}
          kycSubmission={kycSubmission}
          setKycSubmission={setKycSubmission}
        />
      )}
      {page === 'admin' && (
        <AdminPage
          isAdmin={isAdmin}
          kycSubmissions={kycSubmissions}
          publicRequests={publicRequests}
          reviewPosts={reviewPosts}
          user={user}
          onLogin={() => openAuth('login')}
          onLoadReviewData={loadAdminReviewData}
          onReview={handleAdminReview}
        />
      )}
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

      <Footer onNavigate={goToPage} />
    </main>
  )
}

export default App
