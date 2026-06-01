import { useState } from 'react'
import { FileCheck2, MapPin, UserRoundCheck } from 'lucide-react'
import type { AuthUser, KycSubmission, ReliefPost } from '../types/app'
import { LockedPage } from '../components/LockedPage'
import { PageHeader } from '../components/PageHeader'
import { RequestList } from '../components/RequestList'

type AdminPageProps = {
  isAdmin: boolean
  kycSubmissions: KycSubmission[]
  publicRequests: ReliefPost[]
  reviewPosts: ReliefPost[]
  user: AuthUser | null
  onLogin: () => void
  onLoadReviewData: () => void
  onReview: (kind: 'kyc' | 'post', id: string, status: 'APPROVED' | 'REJECTED', adminNotes?: string) => void
}

type Tab = 'kyc' | 'post' | 'requests'

export function AdminPage({ isAdmin, kycSubmissions, publicRequests, reviewPosts, user, onLogin, onLoadReviewData, onReview }: AdminPageProps) {
  const [activeTab, setActiveTab] = useState<Tab>('kyc')

  if (!user) {
    return <LockedPage title="Admin review" body="Login to access admin review screens." onLogin={onLogin} />
  }

  return (
    <section className="content-page page-enter">
      <PageHeader eyebrow="Admin panel" title="Review center" body="Review worker verification and relief posts before they go public." />

      {!isAdmin && (
        <div className="notice-panel">
          <strong>Admin-only area</strong>
          <p>Your account does not have admin access. Ask a platform owner to upgrade your role before reviewing submissions.</p>
        </div>
      )}

      {isAdmin && (
        <div className="toolbar">
          <button className="primary-button" type="button" onClick={onLoadReviewData}>
            Load review queue
          </button>
        </div>
      )}

      {/* ── Tab bar ── */}
      <nav className="admin-tabs">
        <button
          type="button"
          className={`admin-tab-btn${activeTab === 'kyc' ? ' active' : ''}`}
          onClick={() => setActiveTab('kyc')}
        >
          <UserRoundCheck size={15} />
          KYC Review
          {kycSubmissions.length > 0 && (
            <span className="admin-tab-count">{kycSubmissions.length}</span>
          )}
        </button>
        <button
          type="button"
          className={`admin-tab-btn${activeTab === 'post' ? ' active' : ''}`}
          onClick={() => setActiveTab('post')}
        >
          <FileCheck2 size={15} />
          Post Review
          {reviewPosts.length > 0 && (
            <span className="admin-tab-count">{reviewPosts.length}</span>
          )}
        </button>
        <button
          type="button"
          className={`admin-tab-btn${activeTab === 'requests' ? ' active' : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          <MapPin size={15} />
          Active Requests
          {publicRequests.length > 0 && (
            <span className="admin-tab-count">{publicRequests.length}</span>
          )}
        </button>
      </nav>

      {/* ── KYC Review tab ── */}
      {activeTab === 'kyc' && (
        <div className="admin-tab-panel page-enter">
          {kycSubmissions.length === 0 ? (
            <p className="empty-state">No KYC records awaiting review.</p>
          ) : (
            <div className="review-list">
              {kycSubmissions.map((submission) => (
                <article className="review-card" key={submission.id}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <strong>{submission.legalName}</strong>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)' }}>{submission.userEmail}</p>
                  </div>
                  <a className="document-link" href={submission.governmentDocumentUrl} target="_blank" rel="noreferrer">
                    <FileCheck2 size={14} />
                    View government document
                  </a>
                  <input
                    type="text"
                    placeholder="Notes / feedback for applicant..."
                    id={`notes-kyc-${submission.id}`}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '7px',
                      border: '1px solid var(--line)',
                      background: 'var(--surface-strong)',
                      fontSize: '13px',
                      color: 'var(--text)',
                      boxSizing: 'border-box',
                    }}
                  />
                  <div className="review-actions">
                    <button
                      className="primary-button compact"
                      type="button"
                      onClick={() => {
                        const el = document.getElementById(`notes-kyc-${submission.id}`) as HTMLInputElement | null
                        onReview('kyc', submission.id, 'APPROVED', el?.value)
                      }}
                    >
                      Approve
                    </button>
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() => {
                        const el = document.getElementById(`notes-kyc-${submission.id}`) as HTMLInputElement | null
                        onReview('kyc', submission.id, 'REJECTED', el?.value)
                      }}
                    >
                      Reject
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Post Review tab ── */}
      {activeTab === 'post' && (
        <div className="admin-tab-panel page-enter">
          {reviewPosts.length === 0 ? (
            <p className="empty-state">No pending post records.</p>
          ) : (
            <div className="review-list">
              {reviewPosts.map((post) => (
                <article className="review-card" key={post.id}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <strong>{post.title}</strong>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)' }}>
                      {post.postType} · by {post.authorName}
                    </p>
                  </div>
                  <a className="document-link" href={post.authorityDocumentUrl} target="_blank" rel="noreferrer">
                    <FileCheck2 size={14} />
                    View authority letter
                  </a>
                  <input
                    type="text"
                    placeholder="Notes / feedback for applicant..."
                    id={`notes-post-${post.id}`}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '7px',
                      border: '1px solid var(--line)',
                      background: 'var(--surface-strong)',
                      fontSize: '13px',
                      color: 'var(--text)',
                      boxSizing: 'border-box',
                    }}
                  />
                  <div className="review-actions">
                    <button
                      className="primary-button compact"
                      type="button"
                      onClick={() => {
                        const el = document.getElementById(`notes-post-${post.id}`) as HTMLInputElement | null
                        onReview('post', post.id, 'APPROVED', el?.value)
                      }}
                    >
                      Approve
                    </button>
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() => {
                        const el = document.getElementById(`notes-post-${post.id}`) as HTMLInputElement | null
                        onReview('post', post.id, 'REJECTED', el?.value)
                      }}
                    >
                      Reject
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Active Requests tab ── */}
      {activeTab === 'requests' && (
        <div className="page-enter">
          {publicRequests.length === 0 ? (
            <p className="empty-state">No active public requests yet.</p>
          ) : (
            <RequestList title="Requests to monitor" requests={publicRequests} />
          )}
        </div>
      )}
    </section>
  )
}
