import { useState } from 'react'
import {
  FileCheck2,
  MapPin,
  Phone,
  HeartHandshake,
  Landmark,
  ShieldAlert,
  CircleDollarSign,
  Package,
} from 'lucide-react'
import type { ReliefPost } from '../types/app'

type RequestListProps = {
  emptyMessage?: string
  title: string
  requests: ReliefPost[]
  onActionSuccess?: () => void
  onOpenPost?: (post: ReliefPost) => void
}

const URGENCY_COLOR: Record<string, string> = {
  CRITICAL: 'var(--danger, #c0392b)',
  HIGH: 'var(--amber, #d97706)',
  MEDIUM: 'var(--green)',
}

// Category cover photos (posts don't store an image, so we show a representative
// one per category). The gradient + icon behind it is the fallback if it fails.
const CATEGORY_IMAGE: Record<string, string> = {
  FOOD: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=600&q=70',
  CLOTHES: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=600&q=70',
  VOLUNTEER: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=600&q=70',
  MEDICAL: 'https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?auto=format&fit=crop&w=600&q=70',
  SUPPLY: 'https://images.unsplash.com/photo-1580674285054-bed31e145f59?auto=format&fit=crop&w=600&q=70',
  OTHER: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=600&q=70',
}

export function RequestList({
  emptyMessage = 'No posts to show yet.',
  requests,
  title,
  onActionSuccess,
  onOpenPost,
}: RequestListProps) {
  const [activeActionId, setActiveActionId] = useState<string | null>(null)
  const [activeActionType, setActiveActionType] = useState<'DONATE' | 'PLEDGE' | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [amount, setAmount] = useState('')
  const [quantity, setQuantity] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [pledgeResult, setPledgeResult] = useState<{
    quantity: number
    postTitle: string
  } | null>(null)

  const toggleAction = (postId: string, type: 'DONATE' | 'PLEDGE') => {
    if (activeActionId === postId && activeActionType === type) {
      setActiveActionId(null)
      setActiveActionType(null)
    } else {
      setActiveActionId(postId)
      setActiveActionType(type)
      setName('')
      setPhone('')
      setAmount('')
      setQuantity('')
      setErrorMsg('')
      setPledgeResult(null)
    }
  }

  const handleDonate = async (e: React.FormEvent, post: ReliefPost) => {
    e.preventDefault()
    setErrorMsg('')
    setLoading(true)
    try {
      const res = await fetch('/api/donations/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id, amount: Number(amount), donorPhone: phone, donorName: name }),
      })
      const data = (await res.json().catch(() => ({}))) as { paymentUrl?: string; message?: string }
      if (!res.ok) throw new Error(data.message || 'Payment initiation failed.')
      if (data.paymentUrl) window.location.href = data.paymentUrl
      else throw new Error('Payment URL not received.')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const handlePledge = async (e: React.FormEvent, post: ReliefPost) => {
    e.preventDefault()
    setErrorMsg('')
    setLoading(true)
    try {
      const res = await fetch('/api/pledges/material', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: post.id,
          quantity: Number(quantity),
          donorPhone: phone,
          donorName: name,
        }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        pledge?: { quantity: number }
        message?: string
      }
      if (!res.ok) throw new Error(data.message || 'Pledge submission failed.')
      if (data.pledge) {
        setPledgeResult({ quantity: data.pledge.quantity, postTitle: post.title })
        onActionSuccess?.()
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="request-list">
      {title && (
        <div className="list-heading">
          <h2>{title}</h2>
          <span>{requests.length}</span>
        </div>
      )}

      {requests.length === 0 ? (
        <p className="empty-state">{emptyMessage}</p>
      ) : (
        <div className="cards-grid">
          {requests.map((request) => {
            const isFund = request.postType === 'FUNDRAISING'
            const targetQty = request.targetQuantity || 0
            const fulfilledQty = request.fulfilledQuantity || 0
            const targetAmt = request.targetAmount || 0
            const fulfilledAmt = request.fulfilledAmount || 0
            const progress = isFund
              ? targetAmt > 0 ? Math.min(Math.round((Number(fulfilledAmt) / Number(targetAmt)) * 100), 100) : 0
              : targetQty > 0 ? Math.min(Math.round((fulfilledQty / targetQty) * 100), 100) : 0
            const isActive = activeActionId === request.id

            return (
              <article
                className={`post-card post-card--${isFund ? 'fund' : 'help'}${isActive ? ' post-card--active' : ''}`}
                key={request.id}
              >
                {/* ── Cover image + overlaid badges ── */}
                <div className={`post-card-cover post-card-cover--${(request.category || 'OTHER').toLowerCase()}`}>
                  <span className="post-card-cover-icon">
                    {isFund ? <CircleDollarSign size={40} /> : <Package size={40} />}
                  </span>
                  <img
                    className="post-card-cover-img"
                    src={request.imageUrl || CATEGORY_IMAGE[request.category] || CATEGORY_IMAGE.OTHER}
                    alt={request.title}
                    loading="lazy"
                    onError={(e) => e.currentTarget.classList.add('post-card-cover-img--failed')}
                  />
                  <div className="post-card-badges">
                    <span className={`post-badge post-badge--type post-badge--${isFund ? 'fund' : 'help'}`}>
                      {isFund ? <CircleDollarSign size={11} /> : <Package size={11} />}
                      {isFund ? 'Fundraiser' : 'Material Help'}
                    </span>
                    {!isFund && (
                      <span
                        className="post-badge post-badge--urgency post-badge--urgency-solid"
                        style={{ color: URGENCY_COLOR[request.urgency] ?? 'var(--muted)' }}
                      >
                        <ShieldAlert size={11} />
                        {request.urgency}
                      </span>
                    )}
                    {progress >= 100 && (
                      <span className="post-badge post-badge--done">
                        Fully Met
                      </span>
                    )}
                  </div>
                </div>

                {/* ── Title + description (click → detail) ── */}
                <div
                  className={`post-card-body${onOpenPost ? ' post-card-body--clickable' : ''}`}
                  {...(onOpenPost
                    ? {
                        role: 'button',
                        tabIndex: 0,
                        onClick: () => onOpenPost(request),
                        onKeyDown: (e: React.KeyboardEvent) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            onOpenPost(request)
                          }
                        },
                      }
                    : {})}
                >
                  <h3 className="post-card-title">{request.title}</h3>
                  <p className="post-card-desc">{request.description}</p>
                  {onOpenPost && <span className="post-card-viewlink">View details →</span>}
                </div>

                {/* ── Progress ── */}
                <div className="post-card-progress">
                  <div className="post-card-progress-top">
                    <span className="progress-raised">
                      {isFund ? `Rs. ${Number(fulfilledAmt).toLocaleString()}` : `${fulfilledQty} fulfilled`}
                    </span>
                    <span className={`post-card-pct${progress >= 100 ? ' post-card-pct--done' : ''}`}>
                      {progress}%
                    </span>
                  </div>
                  <div className="progress-track">
                    <span style={{ width: `${progress}%` }} />
                  </div>
                  <div className="post-card-progress-goal">
                    {isFund
                      ? targetAmt > 0
                        ? `raised of Rs. ${Number(targetAmt).toLocaleString()} goal`
                        : 'raised so far'
                      : `of ${targetQty} units pledged`}
                  </div>
                </div>

                {/* ── Meta chips ── */}
                <div className="post-card-meta">
                  <span className="post-meta-chip">
                    <Package size={11} />
                    {request.category}
                  </span>
                  <span className="post-meta-chip">
                    <MapPin size={11} />
                    {request.localRepresentativeName || 'Nepal'}
                  </span>
                </div>

                {/* ── Actions ── */}
                <div className="post-card-actions">
                  {progress >= 100 ? (
                    <span className="post-action-btn post-action-btn--met">
                      {isFund ? 'Fully funded' : 'Goal reached'}
                    </span>
                  ) : isFund ? (
                    <button
                      className={`post-action-btn post-action-btn--primary post-action-btn--fund${isActive && activeActionType === 'DONATE' ? ' active' : ''}`}
                      type="button"
                      onClick={() => toggleAction(request.id, 'DONATE')}
                    >
                      <Landmark size={13} />
                      Donate via Khalti
                    </button>
                  ) : (
                    <button
                      className={`post-action-btn post-action-btn--primary post-action-btn--help${isActive && activeActionType === 'PLEDGE' ? ' active' : ''}`}
                      type="button"
                      onClick={() => toggleAction(request.id, 'PLEDGE')}
                    >
                      Pledge Support
                    </button>
                  )}
                  <div className="post-card-secondary-actions">
                    <a className="post-action-btn post-action-btn--ghost" href={`tel:${request.pointOfContactPhone}`}>
                      <Phone size={13} />
                      Call
                    </a>
                    <a
                      className="post-action-btn post-action-btn--ghost"
                      href={`https://www.google.com/maps?q=${request.latitude},${request.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <MapPin size={13} />
                      Map
                    </a>
                    {request.authorityDocumentUrl && (
                      <a
                        className="post-action-btn post-action-btn--ghost"
                        href={request.authorityDocumentUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <FileCheck2 size={13} />
                        Proof
                      </a>
                    )}
                  </div>
                </div>

                {/* ── Inline action panel ── */}
                {isActive && (
                  <div className="post-card-panel page-enter">
                    {activeActionType === 'DONATE' && (
                      <form onSubmit={(e) => handleDonate(e, request)} className="post-panel-form">
                        <p className="post-panel-heading">
                          <Landmark size={15} />
                          Support this campaign
                        </p>
                        <div className="form-grid">
                          <label>
                            Your name
                            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Optional" />
                          </label>
                          <label>
                            Phone number *
                            <input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98XXXXXXXX" />
                          </label>
                        </div>
                        <label>
                          Amount (NPR) *
                          <input required type="number" min="10" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Minimum Rs. 10" />
                        </label>
                        <button type="submit" className="primary-button" disabled={loading} style={{ width: '100%' }}>
                          {loading ? 'Initiating...' : 'Pay via Khalti'}
                        </button>
                        {errorMsg && <p className="post-panel-error">{errorMsg}</p>}
                      </form>
                    )}

                    {activeActionType === 'PLEDGE' && (
                      <>
                        {!pledgeResult ? (
                          <form onSubmit={(e) => handlePledge(e, request)} className="post-panel-form">
                            <p className="post-panel-heading">
                              <HeartHandshake size={15} />
                              Pledge material items
                            </p>
                            <div className="form-grid">
                              <label>
                                Your name
                                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Optional" />
                              </label>
                              <label>
                                Phone number *
                                <input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98XXXXXXXX" />
                              </label>
                            </div>
                            <label>
                              Quantity *
                              <input
                                required
                                type="number"
                                min="1"
                                max={targetQty - fulfilledQty || undefined}
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                placeholder="Units"
                              />
                            </label>
                            <button type="submit" className="primary-button" disabled={loading} style={{ width: '100%' }}>
                              {loading ? 'Submitting...' : 'Confirm Pledge'}
                            </button>
                            {errorMsg && <p className="post-panel-error">{errorMsg}</p>}
                          </form>
                        ) : (
                          <div className="post-panel-success page-enter">
                            <strong>Pledge registered!</strong>
                            <p>Your support for <strong>{pledgeResult.quantity} units</strong> has been added to this request.</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
