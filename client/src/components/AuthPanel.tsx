import { GoogleLogin, type CredentialResponse } from '@react-oauth/google'
import { X } from 'lucide-react'
import type { AuthMode } from '../types/app'

type AuthPanelProps = {
  authMode: AuthMode
  onClose: () => void
  onError: () => void
  onSuccess: (credentialResponse: CredentialResponse) => void
}

export function AuthPanel({ onClose, onError, onSuccess }: AuthPanelProps) {
  return (
    <section className="auth-panel" aria-labelledby="auth-title">
      <button className="close-button" type="button" onClick={onClose} aria-label="Close auth panel">
        <X size={18} />
      </button>
      <h2 id="auth-title">Welcome back</h2>
      <p className="panel-copy">Continue securely with your Google account.</p>

      <div className="google-button-wrap">
        <GoogleLogin
          onSuccess={onSuccess}
          onError={onError}
          text="signin_with"
          shape="rectangular"
          size="large"
          width="100%"
        />
      </div>

      <p className="auth-note">Google sign-in keeps your account secure and helps us protect verified relief workflows.</p>
    </section>
  )
}
