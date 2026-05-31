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

export function AdminPage({ isAdmin, kycSubmissions, publicRequests, reviewPosts, user, onLogin, onLoadReviewData, onReview }: AdminPageProps) {
  if (!user) {
    return <LockedPage title="Admin review" body="Login to access admin review screens." onLogin={onLogin} />
  }

  return (
    <section className="content-page page-enter">
      <PageHeader eyebrow="Admin panel" title="Review center" body="Review worker verification and relief posts before they go public." />
      {isAdmin && (
        <div className="toolbar">
          <button className="primary-button" type="button" onClick={onLoadReviewData}>
            Load review queue
          </button>
        </div>
      )}
      {!isAdmin && (
        <div className="notice-panel">
          <strong>Admin-only area</strong>
          <p>Your account does not have admin access. Ask a platform owner to upgrade your role before reviewing submissions.</p>
        </div>
      )}
      <div className="admin-grid">
        <div className="review-column">
          <div className="review-heading">
            <UserRoundCheck size={20} />
            <h2>Pending KYC</h2>
          </div>
          {kycSubmissions.length === 0 ? (
            <p className="empty-state">No pending KYC records.</p>
          ) : (
            <div className="request-items">
              {kycSubmissions.map((submission) => (
                <article className="request-card" key={submission.id}>
                  <strong>{submission.legalName}</strong>
                  <p>{submission.userEmail}</p>
                  <a className="document-link" href={submission.governmentDocumentUrl} target="_blank" rel="noreferrer">
                    <FileCheck2 size={16} />
                    Government document
                  </a>
                  <div style={{ marginTop: '8px', marginBottom: '8px' }}>
                    <input
                      type="text"
                      placeholder="Notes / feedback..."
                      id={`notes-kyc-${submission.id}`}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--line)',
                        background: 'var(--surface-strong)',
                        fontSize: '13px'
                      }}
                    />
                  </div>
                  <div className="review-actions">
                    <button className="primary-button compact" type="button" onClick={() => {
                      const el = document.getElementById(`notes-kyc-${submission.id}`) as HTMLInputElement | null;
                      onReview('kyc', submission.id, 'APPROVED', el?.value);
                    }}>
                      Approve
                    </button>
                    <button className="secondary-button" type="button" onClick={() => {
                      const el = document.getElementById(`notes-kyc-${submission.id}`) as HTMLInputElement | null;
                      onReview('kyc', submission.id, 'REJECTED', el?.value);
                    }}>
                      Reject
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
        <div className="review-column">
          <div className="review-heading">
            <FileCheck2 size={20} />
            <h2>Post review</h2>
          </div>
          {reviewPosts.length === 0 ? (
            <p className="empty-state">No pending post records.</p>
          ) : (
            <div className="request-items">
              {reviewPosts.map((post) => (
                <article className="request-card" key={post.id}>
                  <strong>{post.title}</strong>
                  <p>{post.postType} by {post.authorName}</p>
                  <a className="document-link" href={post.authorityDocumentUrl} target="_blank" rel="noreferrer">
                    <FileCheck2 size={16} />
                    Authority letter
                  </a>
                  <div style={{ marginTop: '8px', marginBottom: '8px' }}>
                    <input
                      type="text"
                      placeholder="Notes / feedback..."
                      id={`notes-post-${post.id}`}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--line)',
                        background: 'var(--surface-strong)',
                        fontSize: '13px'
                      }}
                    />
                  </div>
                  <div className="review-actions">
                    <button className="primary-button compact" type="button" onClick={() => {
                      const el = document.getElementById(`notes-post-${post.id}`) as HTMLInputElement | null;
                      onReview('post', post.id, 'APPROVED', el?.value);
                    }}>
                      Approve
                    </button>
                    <button className="secondary-button" type="button" onClick={() => {
                      const el = document.getElementById(`notes-post-${post.id}`) as HTMLInputElement | null;
                      onReview('post', post.id, 'REJECTED', el?.value);
                    }}>
                      Reject
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
        <div className="review-column">
          <div className="review-heading">
            <MapPin size={20} />
            <h2>Active requests</h2>
          </div>
          {publicRequests.length === 0 ? <p className="empty-state">No active public requests yet.</p> : <RequestList title="Requests to monitor" requests={publicRequests} />}
        </div>
      </div>
    </section>
  )
}
