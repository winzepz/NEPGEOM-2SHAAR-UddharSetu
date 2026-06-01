import { useState } from 'react'
import {
  ArrowLeft,
  CircleDollarSign,
  Package,
  ShieldAlert,
  MapPin,
  Phone,
  FileCheck2,
  Landmark,
  HeartHandshake,
  Sparkles,
  User,
  Users,
  CalendarDays,
  BadgeCheck,
} from 'lucide-react'
import type { ReliefPost } from '../types/app'

type PostDetailPageProps = {
  post: ReliefPost | null
  onBack: () => void
  onActionSuccess?: () => void
}

const URGENCY_COLOR: Record<string, string> = {
  CRITICAL: 'var(--danger, #c0392b)',
  HIGH: 'var(--amber, #d97706)',
  MEDIUM: 'var(--green)',
}

const CATEGORY_IMAGE: Record<string, string> = {
  FOOD: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&q=75',
  CLOTHES: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=1200&q=75',
  VOLUNTEER: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=1200&q=75',
  MEDICAL: 'https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?auto=format&fit=crop&w=1200&q=75',
  SUPPLY: 'https://images.unsplash.com/photo-1580674285054-bed31e145f59?auto=format&fit=crop&w=1200&q=75',
  OTHER: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=1200&q=75',
}

export function PostDetailPage({ post, onBack, onActionSuccess }: PostDetailPageProps) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [amount, setAmount] = useState('')
  const [quantity, setQuantity] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [pledgeResult, setPledgeResult] = useState<{ quantity: number } | null>(null)

  if (!post) {
    return (
      <section className="content-page page-enter">
        <button className="detail-back" type="button" onClick={onBack}>
          <ArrowLeft size={16} /> Back
        </button>
        <p className="empty-state">This post is no longer available.</p>
      </section>
    )
  }

  const isFund = post.postType === 'FUNDRAISING'
  const targetQty = post.targetQuantity || 0
  const fulfilledQty = post.fulfilledQuantity || 0
  const targetAmt = post.targetAmount || 0
  const fulfilledAmt = post.fulfilledAmount || 0
  const progress = isFund
    ? targetAmt > 0
      ? Math.min(Math.round((Number(fulfilledAmt) / Number(targetAmt)) * 100), 100)
      : 0
    : targetQty > 0
      ? Math.min(Math.round((fulfilledQty / targetQty) * 100), 100)
      : 0
  const isComplete = progress >= 100
  const remaining = isFund ? Math.max(targetAmt - fulfilledAmt, 0) : Math.max(targetQty - fulfilledQty, 0)

  const handleDonate = async (e: React.FormEvent) => {
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

  const handlePledge = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setLoading(true)
    try {
      const res = await fetch('/api/pledges/material', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id, quantity: Number(quantity), donorPhone: phone, donorName: name }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        pledge?: { quantity: number }
        message?: string
      }
      if (!res.ok) throw new Error(data.message || 'Pledge submission failed.')
      if (data.pledge) {
        setPledgeResult({ quantity: data.pledge.quantity })
        onActionSuccess?.()
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className={`content-page detail-page page-enter detail-page--${isFund ? 'fund' : 'help'}`}>
      <button className="detail-back" type="button" onClick={onBack}>
        <ArrowLeft size={16} /> Back to listings
      </button>

      {/* ── Cover banner ── */}
      <div className={`detail-cover post-card-cover--${(post.category || 'OTHER').toLowerCase()}`}>
        <span className="detail-cover-icon">
          {isFund ? <CircleDollarSign size={56} /> : <Package size={56} />}
        </span>
        <img
          className="detail-cover-img"
          src={post.imageUrl || CATEGORY_IMAGE[post.category] || CATEGORY_IMAGE.OTHER}
          alt={post.title}
          onError={(e) => e.currentTarget.classList.add('post-card-cover-img--failed')}
        />
      </div>

      {/* ── Header ── */}
      <header className="detail-header">
        <div className="detail-badges">
          <span className={`post-badge post-badge--type post-badge--${isFund ? 'fund' : 'help'}`}>
            {isFund ? <CircleDollarSign size={12} /> : <Package size={12} />}
            {isFund ? 'Fundraiser' : 'Material Help'}
          </span>
          {!isFund && (
            <span className="post-badge post-badge--urgency" style={{ color: URGENCY_COLOR[post.urgency] ?? 'var(--muted)' }}>
              <ShieldAlert size={12} />
              {post.urgency}
            </span>
          )}
          <span className="post-badge post-badge--verified">
            <BadgeCheck size={12} />
            Admin verified
          </span>
          {isComplete && (
            <span className="post-badge post-badge--done">
              {isFund ? 'Fully funded' : 'Goal reached'}
            </span>
          )}
        </div>
        <h1 className="detail-title">{post.title}</h1>
        <div className="detail-meta-row">
          <span><Package size={14} /> {post.category}</span>
          <span><MapPin size={14} /> {post.localRepresentativeName || 'Nepal'}</span>
          <span><CalendarDays size={14} /> Posted {new Date(post.createdAt).toLocaleDateString()}</span>
        </div>
      </header>

      {/* ── Two-column body ── */}
      <div className="detail-grid">
        {/* Main content */}
        <div className="detail-main">
          <div className="detail-block">
            <h2 className="detail-block-title">About this {isFund ? 'campaign' : 'request'}</h2>
            <p className="detail-description">{post.description}</p>
          </div>

          <div className="detail-block">
            <h2 className="detail-block-title">Beneficiary & contact</h2>
            <div className="detail-info-grid">
              <DetailInfo icon={<User size={16} />} label="Beneficiary" value={post.beneficiaryName} />
              <DetailInfo icon={<Phone size={16} />} label="Beneficiary phone" value={post.beneficiaryPhone} />
              <DetailInfo icon={<User size={16} />} label="Point of contact" value={post.pointOfContactName} />
              <DetailInfo icon={<Phone size={16} />} label="Contact phone" value={post.pointOfContactPhone} />
              <DetailInfo icon={<Users size={16} />} label="Local representative" value={post.localRepresentativeName} />
              <DetailInfo icon={<Phone size={16} />} label="Representative phone" value={post.localRepresentativePhone} />
            </div>
          </div>

          <div className="detail-block">
            <h2 className="detail-block-title">Location & verification</h2>
            <div className="detail-actions-row">
              <a
                className="secondary-button"
                href={`https://www.google.com/maps?q=${post.latitude},${post.longitude}`}
                target="_blank"
                rel="noreferrer"
              >
                <MapPin size={16} /> View on map
              </a>
              <a className="secondary-button" href={`tel:${post.pointOfContactPhone}`}>
                <Phone size={16} /> Call contact
              </a>
              {post.authorityDocumentUrl && (
                <a className="secondary-button" href={post.authorityDocumentUrl} target="_blank" rel="noreferrer">
                  <FileCheck2 size={16} /> Authority proof
                </a>
              )}
            </div>
            <p className="detail-coords">
              <MapPin size={13} /> {Number(post.latitude).toFixed(5)}, {Number(post.longitude).toFixed(5)}
            </p>
          </div>
        </div>

        {/* Sticky sidebar */}
        <aside className="detail-sidebar">
          <div className="detail-donate-card">
            <div className="detail-progress-head">
              <span className="detail-raised">
                {isFund ? `Rs. ${Number(fulfilledAmt).toLocaleString()}` : `${fulfilledQty} units`}
              </span>
              <span className={`detail-pct${isComplete ? ' detail-pct--done' : ''}`}>{progress}%</span>
            </div>
            <div className="progress-track detail-track">
              <span style={{ width: `${progress}%` }} />
            </div>
            <p className="detail-goal">
              {isFund
                ? `raised of Rs. ${Number(targetAmt).toLocaleString()} goal`
                : `fulfilled of ${targetQty} units needed`}
            </p>
            {!isComplete && (
              <p className="detail-remaining">
                {isFund
                  ? `Rs. ${Number(remaining).toLocaleString()} still needed`
                  : `${remaining} units still needed`}
              </p>
            )}

            {/* Donate / Pledge form */}
            {isComplete ? (
              <div className="detail-met">
                <Sparkles size={20} />
                <strong>{isFund ? 'This campaign is fully funded' : 'This request is fully met'}</strong>
                <p>Thank you to everyone who contributed.</p>
              </div>
            ) : isFund ? (
              <form onSubmit={handleDonate} className="detail-form">
                <label>
                  Your name
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Optional" />
                </label>
                <label>
                  Phone number *
                  <input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98XXXXXXXX" />
                </label>
                <label>
                  Amount (NPR) *
                  <input required type="number" min="10" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Minimum Rs. 10" />
                </label>
                <button type="submit" className="primary-button detail-cta" disabled={loading}>
                  <Landmark size={16} />
                  {loading ? 'Redirecting…' : 'Donate via Khalti'}
                </button>
                {errorMsg && <p className="post-panel-error">{errorMsg}</p>}
              </form>
            ) : pledgeResult ? (
              <div className="post-panel-success page-enter">
                <strong>Pledge registered!</strong>
                <p>Your support for <strong>{pledgeResult.quantity} units</strong> has been added to this request.</p>
              </div>
            ) : (
              <form onSubmit={handlePledge} className="detail-form">
                <label>
                  Your name
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Optional" />
                </label>
                <label>
                  Phone number *
                  <input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98XXXXXXXX" />
                </label>
                <label>
                  Quantity *
                  <input
                    required
                    type="number"
                    min="1"
                    max={remaining || undefined}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Units"
                  />
                </label>
                <button type="submit" className="primary-button detail-cta" disabled={loading}>
                  <HeartHandshake size={16} />
                  {loading ? 'Submitting…' : 'Pledge support'}
                </button>
                {errorMsg && <p className="post-panel-error">{errorMsg}</p>}
              </form>
            )}
          </div>
        </aside>
      </div>
    </section>
  )
}

function DetailInfo({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="detail-info">
      <span className="detail-info-icon">{icon}</span>
      <div>
        <span className="detail-info-label">{label}</span>
        <span className="detail-info-value">{value || '—'}</span>
      </div>
    </div>
  )
}
