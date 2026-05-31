import { FileCheck2, MapPin, UserRoundCheck } from 'lucide-react'
import type { AuthUser, HelpRequest } from '../types/app'
import { LockedPage } from '../components/LockedPage'
import { PageHeader } from '../components/PageHeader'
import { RequestList } from '../components/RequestList'
import type { ReactNode } from 'react'

type AdminPageProps = {
  isAdmin: boolean
  publicRequests: HelpRequest[]
  user: AuthUser | null
  onLogin: () => void
}

export function AdminPage({ isAdmin, publicRequests, user, onLogin }: AdminPageProps) {
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

function ReviewColumn({ icon, title }: { icon: ReactNode; title: string }) {
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
