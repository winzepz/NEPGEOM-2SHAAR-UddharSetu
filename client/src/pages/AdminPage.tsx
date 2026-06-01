import { useState } from 'react'
import {
  FileCheck2,
  MapPin,
  UserRoundCheck,
  Check,
  X,
  Clock,
  ShieldCheck,
  CircleDollarSign,
  Package,
  Phone,
  Calendar,
  IdCard,
  Image as ImageIcon,
  RefreshCw,
} from 'lucide-react'
import type { AuthUser, KycSubmission, ReliefPost } from '../types/app'
import { LockedPage } from '../components/LockedPage'
import { PageHeader } from '../components/PageHeader'
import { RequestList } from '../components/RequestList'
import { StatCard } from '../components/StatCard'

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
  const [notes, setNotes] = useState<Record<string, string>>({})

  if (!user) {
    return <LockedPage title="Admin review" body="Login to access admin review screens." onLogin={onLogin} />
  }

  const setNote = (id: string, value: string) => setNotes((n) => ({ ...n, [id]: value }))

  return (
    <section className="content-page page-enter">
      <div className="admin-head-row">
        <PageHeader eyebrow="Admin panel" title="Review center" body="Verify social workers and approve relief posts before they go public." />
        {isAdmin && (
          <button className="secondary-button admin-reload" type="button" onClick={onLoadReviewData}>
            <RefreshCw size={15} />
            Refresh queue
          </button>
        )}
      </div>

      {!isAdmin && (
        <div className="notice-panel notice-panel--danger">
          <div className="status-icon status-icon--danger">
            <ShieldCheck size={22} />
          </div>
          <strong className="notice-title--danger">Admin-only area</strong>
          <p>Your account does not have admin access. Ask a platform owner to upgrade your role before reviewing submissions.</p>
        </div>
      )}

      {isAdmin && (
        <>
          {/* ── Overview ── */}
          <div className="stats-grid admin-stats">
            <StatCard icon={<UserRoundCheck size={18} />} label="KYC awaiting review" value={kycSubmissions.length} accentColor={kycSubmissions.length ? 'var(--amber)' : undefined} />
            <StatCard icon={<FileCheck2 size={18} />} label="Posts awaiting review" value={reviewPosts.length} accentColor={reviewPosts.length ? 'var(--amber)' : undefined} />
            <StatCard icon={<ShieldCheck size={18} />} label="Live approved posts" value={publicRequests.length} accentColor="var(--green)" />
          </div>

          {/* ── Tab bar ── */}
          <nav className="admin-tabs">
            <button type="button" className={`admin-tab-btn${activeTab === 'kyc' ? ' active' : ''}`} onClick={() => setActiveTab('kyc')}>
              <UserRoundCheck size={15} />
              KYC Review
              {kycSubmissions.length > 0 && <span className="admin-tab-count">{kycSubmissions.length}</span>}
            </button>
            <button type="button" className={`admin-tab-btn${activeTab === 'post' ? ' active' : ''}`} onClick={() => setActiveTab('post')}>
              <FileCheck2 size={15} />
              Post Review
              {reviewPosts.length > 0 && <span className="admin-tab-count">{reviewPosts.length}</span>}
            </button>
            <button type="button" className={`admin-tab-btn${activeTab === 'requests' ? ' active' : ''}`} onClick={() => setActiveTab('requests')}>
              <MapPin size={15} />
              Live Posts
              {publicRequests.length > 0 && <span className="admin-tab-count">{publicRequests.length}</span>}
            </button>
          </nav>

          {/* ── KYC Review tab ── */}
          {activeTab === 'kyc' && (
            <div className="admin-tab-panel page-enter">
              {kycSubmissions.length === 0 ? (
                <EmptyQueue label="No KYC submissions awaiting review." />
              ) : (
                <div className="review-list">
                  {kycSubmissions.map((s) => (
                    <article className="review-card" key={s.id}>
                      <div className="review-card-head">
                        {s.photoUrl ? (
                          <img className="review-avatar" src={s.photoUrl} alt={s.legalName} />
                        ) : (
                          <div className="review-avatar review-avatar--placeholder"><UserRoundCheck size={22} /></div>
                        )}
                        <div className="review-card-headtext">
                          <strong>{s.legalName}</strong>
                          <span>{s.userEmail}</span>
                        </div>
                        <span className="review-pending-pill"><Clock size={12} /> Pending</span>
                      </div>

                      <div className="review-fields">
                        <ReviewField icon={<Calendar size={14} />} label="Date of birth" value={s.dateOfBirth} />
                        <ReviewField icon={<IdCard size={14} />} label="Government ID" value={s.governmentIdNumber} />
                        <ReviewField icon={<Phone size={14} />} label="Phone" value={s.phoneNumber} />
                      </div>

                      <div className="review-docs">
                        <a className="review-doc-link" href={s.governmentDocumentUrl} target="_blank" rel="noreferrer">
                          <FileCheck2 size={14} /> Government document
                        </a>
                        {s.photoUrl && (
                          <a className="review-doc-link" href={s.photoUrl} target="_blank" rel="noreferrer">
                            <ImageIcon size={14} /> Profile photo
                          </a>
                        )}
                      </div>

                      <textarea
                        className="admin-notes-input"
                        rows={2}
                        placeholder="Notes / feedback for the applicant (sent on approve or reject)…"
                        value={notes[s.id] ?? ''}
                        onChange={(e) => setNote(s.id, e.target.value)}
                      />

                      <div className="review-actions">
                        <button className="review-btn review-btn--approve" type="button" onClick={() => onReview('kyc', s.id, 'APPROVED', notes[s.id])}>
                          <Check size={15} /> Approve
                        </button>
                        <button className="review-btn review-btn--reject" type="button" onClick={() => onReview('kyc', s.id, 'REJECTED', notes[s.id])}>
                          <X size={15} /> Reject
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
                <EmptyQueue label="No relief posts awaiting review." />
              ) : (
                <div className="review-list">
                  {reviewPosts.map((post) => {
                    const isFund = post.postType === 'FUNDRAISING'
                    return (
                      <article className="review-card" key={post.id}>
                        <div className="review-card-head">
                          <div className="review-card-headtext">
                            <div className="review-post-badges">
                              <span className={`post-badge post-badge--type post-badge--${isFund ? 'fund' : 'help'}`}>
                                {isFund ? <CircleDollarSign size={11} /> : <Package size={11} />}
                                {isFund ? 'Fundraiser' : 'Material Help'}
                              </span>
                              {!isFund && <span className="post-badge post-badge--urgency">{post.urgency}</span>}
                            </div>
                            <strong>{post.title}</strong>
                            <span>by {post.authorName}</span>
                          </div>
                          <span className="review-pending-pill"><Clock size={12} /> Pending</span>
                        </div>

                        <p className="review-post-desc">{post.description}</p>

                        <div className="review-fields">
                          <ReviewField icon={<Package size={14} />} label="Category" value={post.category} />
                          <ReviewField
                            icon={isFund ? <CircleDollarSign size={14} /> : <Package size={14} />}
                            label={isFund ? 'Target amount' : 'Target quantity'}
                            value={isFund ? `Rs. ${Number(post.targetAmount ?? 0).toLocaleString()}` : `${post.targetQuantity ?? 0} units`}
                          />
                          <ReviewField icon={<Phone size={14} />} label="Contact" value={post.pointOfContactPhone} />
                        </div>

                        <div className="review-docs">
                          {post.imageUrl && (
                            <a className="review-doc-link" href={post.imageUrl} target="_blank" rel="noreferrer">
                              <ImageIcon size={14} /> Post image
                            </a>
                          )}
                          <a className="review-doc-link" href={post.authorityDocumentUrl} target="_blank" rel="noreferrer">
                            <FileCheck2 size={14} /> Authority letter
                          </a>
                          <a className="review-doc-link" href={`https://www.google.com/maps?q=${post.latitude},${post.longitude}`} target="_blank" rel="noreferrer">
                            <MapPin size={14} /> Location on map
                          </a>
                        </div>

                        <textarea
                          className="admin-notes-input"
                          rows={2}
                          placeholder="Notes / feedback for the author (sent on approve or reject)…"
                          value={notes[post.id] ?? ''}
                          onChange={(e) => setNote(post.id, e.target.value)}
                        />

                        <div className="review-actions">
                          <button className="review-btn review-btn--approve" type="button" onClick={() => onReview('post', post.id, 'APPROVED', notes[post.id])}>
                            <Check size={15} /> Approve
                          </button>
                          <button className="review-btn review-btn--reject" type="button" onClick={() => onReview('post', post.id, 'REJECTED', notes[post.id])}>
                            <X size={15} /> Reject
                          </button>
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Live posts tab ── */}
          {activeTab === 'requests' && (
            <div className="page-enter">
              {publicRequests.length === 0 ? (
                <EmptyQueue label="No live approved posts yet." />
              ) : (
                <RequestList title="Live approved posts" requests={publicRequests} />
              )}
            </div>
          )}
        </>
      )}
    </section>
  )
}

function ReviewField({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="review-field">
      <span className="review-field-icon">{icon}</span>
      <div>
        <span className="review-field-label">{label}</span>
        <span className="review-field-value">{value || '—'}</span>
      </div>
    </div>
  )
}

function EmptyQueue({ label }: { label: string }) {
  return (
    <div className="admin-empty">
      <Check size={26} />
      <p>{label}</p>
      <span>You're all caught up.</span>
    </div>
  )
}
