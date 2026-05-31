import type { AuthUser, ReliefPost } from '../types/app'
import { InfoRow } from '../components/InfoRow'
import { LockedPage } from '../components/LockedPage'
import { PageHeader } from '../components/PageHeader'

type ProfilePageProps = {
  myRequests: ReliefPost[]
  user: AuthUser | null
  onLogin: () => void
}

export function ProfilePage({ myRequests, user, onLogin }: ProfilePageProps) {
  if (!user) {
    return <LockedPage title="Profile" body="Login to view your saved user record." onLogin={onLogin} />
  }

  return (
    <section className="content-page narrow-page page-enter">
      <PageHeader eyebrow="Account" title="Your profile" body="Manage your identity, role, and verification status." />
      <div className="profile-panel">
        {user.picture && <img src={user.picture} alt="" />}
        <dl>
          <InfoRow label="Name" value={user.fullName || 'Not set'} />
          <InfoRow label="Email" value={user.email || 'Not set'} />
          <InfoRow label="Role" value={user.role || 'SOCIAL_WORKER'} />
          <InfoRow label="Status" value={user.status || 'PENDING'} />
          <InfoRow label="User ID" value={user.id} />
          <InfoRow label="Saved requests" value={String(myRequests.length)} />
        </dl>
      </div>
    </section>
  )
}
