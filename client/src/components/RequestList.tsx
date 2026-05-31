import { useState } from 'react'
import { FileCheck2, MapPin, Phone, HeartHandshake, Landmark, Sparkles } from 'lucide-react'
import type { ReliefPost } from '../types/app'
import { InfoRow } from './InfoRow'

type RequestListProps = {
  emptyMessage?: string
  title: string
  requests: ReliefPost[]
  onActionSuccess?: () => void
}

const HUBS = [
  'Kathmandu Relief Center',
  'Lalitpur Operations Hub',
  'Bhaktapur Logistics Hub',
  'Pokhara Disaster Support Office',
]

export function RequestList({ emptyMessage = 'No posts to show yet.', requests, title, onActionSuccess }: RequestListProps) {
  const [activeActionId, setActiveActionId] = useState<string | null>(null)
  const [activeActionType, setActiveActionType] = useState<'DONATE' | 'PLEDGE' | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [amount, setAmount] = useState('')
  const [quantity, setQuantity] = useState('')
  const [hubName, setHubName] = useState(HUBS[0])
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [pledgeResult, setPledgeResult] = useState<{
    token: string
    quantity: number
    hub: string
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
      setHubName(HUBS[0])
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
        body: JSON.stringify({
          postId: post.id,
          amount: Number(amount),
          donorPhone: phone,
          donorName: name,
        }),
      })
      const data = await res.json().catch(() => ({})) as { paymentUrl?: string; message?: string }

      if (!res.ok) {
        throw new Error(data.message || 'Payment initiation failed.')
      }

      if (data.paymentUrl) {
        window.location.href = data.paymentUrl
      } else {
        throw new Error('Payment URL not received from payment gateway.')
      }
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
          hubName,
        }),
      })
      const data = await res.json().catch(() => ({})) as { pledge?: { secure_token: string; quantity: number; hub_name: string }; message?: string }

      if (!res.ok) {
        throw new Error(data.message || 'Pledge submission failed.')
      }

      if (data.pledge) {
        setPledgeResult({
          token: data.pledge.secure_token,
          quantity: data.pledge.quantity,
          hub: data.pledge.hub_name,
          postTitle: post.title,
        })
        if (onActionSuccess) {
          onActionSuccess()
        }
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="request-list">
      <div className="list-heading">
        <h2>{title}</h2>
        <span>{requests.length}</span>
      </div>
      {requests.length === 0 ? (
        <p className="empty-state">{emptyMessage}</p>
      ) : (
        <div className="request-items">
          {requests.map((request) => {
            const isFund = request.postType === 'FUNDRAISING'
            const targetQty = request.targetQuantity || 0
            const fulfilledQty = request.fulfilledQuantity || 0
            const targetAmt = request.targetAmount || 0
            const fulfilledAmt = request.fulfilledAmount || 0

            const progress = isFund
              ? targetAmt > 0
                ? Math.round((Number(fulfilledAmt) / Number(targetAmt)) * 100)
                : 0
              : targetQty > 0
                ? Math.round((fulfilledQty / targetQty) * 100)
                : 0

            return (
              <article className="request-card" key={request.id}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <strong>{request.title}</strong>
                    <span className={`status-badge ${progress >= 100 ? 'approved' : ''}`} style={{ fontSize: '11px', padding: '4px 8px' }}>
                      {progress >= 100 ? 'Fully Met' : `${progress}% Met`}
                    </span>
                  </div>
                  <p>{request.description}</p>
                </div>

                {/* Unified Progress Bar */}
                <div style={{ margin: '14px 0', padding: '12px', background: 'rgba(95, 61, 28, 0.05)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 900, marginBottom: '6px', color: 'var(--primary-dark)' }}>
                    {isFund ? (
                      <>
                        <span>Raised: Rs. {fulfilledAmt}</span>
                        <span>Target: Rs. {targetAmt}</span>
                      </>
                    ) : (
                      <>
                        <span>Fulfilled: {fulfilledQty} units</span>
                        <span>Goal: {targetQty} units</span>
                      </>
                    )}
                  </div>
                  <div className="progress-track" style={{ height: '8px', margin: 0 }}>
                    <span style={{ width: `${Math.min(progress, 100)}%` }} />
                  </div>
                </div>

                <dl>
                  <InfoRow label="Category" value={request.category} />
                  <InfoRow label="Type" value={request.postType === 'FUNDRAISING' ? 'Fundraiser' : 'Material Help'} />
                  <InfoRow label="Contact" value={request.pointOfContactName} />
                  <InfoRow label="Representative" value={request.localRepresentativeName} />
                  <InfoRow label="Urgency" value={request.urgency} />
                </dl>

                {/* Action Buttons */}
                <div className="card-actions" style={{ marginTop: '8px' }}>
                  {isFund && progress < 100 && (
                    <button
                      className="primary-button compact"
                      type="button"
                      onClick={() => toggleAction(request.id, 'DONATE')}
                      style={{ padding: '0 12px' }}
                    >
                      <Landmark size={16} />
                      Donate Funds
                    </button>
                  )}
                  {!isFund && progress < 100 && (
                    <button
                      className="primary-button compact"
                      type="button"
                      onClick={() => toggleAction(request.id, 'PLEDGE')}
                      style={{ padding: '0 12px' }}
                    >
                      <HeartHandshake size={16} />
                      Pledge Items
                    </button>
                  )}
                  <a className="document-link" href={`tel:${request.pointOfContactPhone}`} style={{ fontSize: '13px' }}>
                    <Phone size={16} />
                    Call POC
                  </a>
                  <a
                    className="document-link"
                    href={`https://www.google.com/maps?q=${request.latitude},${request.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: '13px' }}
                  >
                    <MapPin size={16} />
                    Location
                  </a>
                  {request.authorityDocumentUrl && (
                    <a className="document-link" href={request.authorityDocumentUrl} target="_blank" rel="noreferrer" style={{ fontSize: '13px' }}>
                      <FileCheck2 size={16} />
                      Proof doc
                    </a>
                  )}
                </div>

                {/* Inline Interaction Panel */}
                {activeActionId === request.id && (
                  <div style={{ marginTop: '16px', padding: '16px', background: 'var(--surface-strong)', borderRadius: '8px', border: '1px dashed var(--line)' }} className="page-enter">
                    {activeActionType === 'DONATE' && (
                      <form onSubmit={(e) => handleDonate(e, request)} className="form-panel" style={{ padding: 0, gap: '12px', boxShadow: 'none', background: 'transparent', border: 0 }}>
                        <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--primary-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Landmark size={18} />
                          Support Financial Campaign
                        </h3>
                        <div className="form-grid">
                          <label>
                            Your Name (Optional)
                            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Anonymous" style={{ padding: '8px' }} />
                          </label>
                          <label>
                            Your Phone Number
                            <input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98XXXXXXXX" style={{ padding: '8px' }} />
                          </label>
                        </div>
                        <label>
                          Donation Amount (NPR)
                          <input required type="number" min="10" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount in Rupees" style={{ padding: '8px' }} />
                        </label>
                        <button type="submit" className="primary-button" disabled={loading} style={{ width: '100%', minHeight: '38px', marginTop: '4px' }}>
                          {loading ? 'Initiating Checkout...' : 'Pay via Khalti'}
                        </button>
                        {errorMsg && <p style={{ color: 'var(--danger)', margin: 0, fontSize: '13px', fontWeight: 900 }}>{errorMsg}</p>}
                      </form>
                    )}

                    {activeActionType === 'PLEDGE' && (
                      <>
                        {!pledgeResult ? (
                          <form onSubmit={(e) => handlePledge(e, request)} className="form-panel" style={{ padding: 0, gap: '12px', boxShadow: 'none', background: 'transparent', border: 0 }}>
                            <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--primary-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <HeartHandshake size={18} />
                              Commit Material Resources
                            </h3>
                            <div className="form-grid">
                              <label>
                                Your Name (Optional)
                                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Anonymous" style={{ padding: '8px' }} />
                              </label>
                              <label>
                                Your Phone Number
                                <input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98XXXXXXXX" style={{ padding: '8px' }} />
                              </label>
                            </div>
                            <div className="form-grid">
                              <label>
                                Quantity to Pledge
                                <input required type="number" min="1" max={targetQty - fulfilledQty} value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Units committing" style={{ padding: '8px' }} />
                              </label>
                              <label>
                                Select Drop-off Center
                                <select value={hubName} onChange={(e) => setHubName(e.target.value)} style={{ padding: '8px' }}>
                                  {HUBS.map((h) => (
                                    <option key={h} value={h}>{h}</option>
                                  ))}
                                </select>
                              </label>
                            </div>
                            <button type="submit" className="primary-button" disabled={loading} style={{ width: '100%', minHeight: '38px', marginTop: '4px' }}>
                              {loading ? 'Submitting Commit...' : 'Confirm Material Pledge'}
                            </button>
                            {errorMsg && <p style={{ color: 'var(--danger)', margin: 0, fontSize: '13px', fontWeight: 900 }}>{errorMsg}</p>}
                          </form>
                        ) : (
                          <div style={{ textAlign: 'center', padding: '10px 0' }} className="page-enter">
                            <div style={{ color: 'var(--green)', display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                              <Sparkles size={36} />
                            </div>
                            <strong style={{ display: 'block', fontSize: '16px', color: 'var(--green)' }}>Pledge Successfully Registered!</strong>
                            <p style={{ margin: '8px 0', fontSize: '14px', color: 'var(--muted)' }}>
                              Please drop off your <strong>{pledgeResult.quantity} units</strong> at the <strong>{pledgeResult.hub}</strong>.
                            </p>
                            <div style={{ background: 'var(--surface)', padding: '12px', borderRadius: '6px', border: '1px solid var(--line)', margin: '14px 0', display: 'inline-block' }}>
                              <span style={{ fontSize: '12px', color: 'var(--muted)', display: 'block', textTransform: 'uppercase', fontWeight: 900 }}>Drop-off Token</span>
                              <strong style={{ fontSize: '20px', letterSpacing: '2px', color: 'var(--primary-dark)' }}>{pledgeResult.token}</strong>
                            </div>
                            <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)', fontStyle: 'italic' }}>
                              Provide this token to the social worker at the center to verify drop-off.
                            </p>
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
