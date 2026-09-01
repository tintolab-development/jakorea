/**
 * Auth 셸 플레이스홀더 — CMS find-email / find-password / register 자리
 */

import { useNavigate } from 'react-router-dom'
import { AuthLogoLink } from '@/features/auth/ui/auth-logo-link'
import { LoadingButton } from '@/shared/ui/loading-button'
import '@/pages/auth/auth-shell.css'
import './auth-placeholder-page.css'

interface AuthPlaceholderPageProps {
  title: string
  description: string
}

export function AuthPlaceholderPage({ title, description }: AuthPlaceholderPageProps) {
  const navigate = useNavigate()

  return (
    <div className="auth-page">
      <div className="auth-card">
        <AuthLogoLink />
        <div className="auth-form-body auth-placeholder">
          <h1 className="auth-placeholder__title">{title}</h1>
          <p className="auth-placeholder__description">{description}</p>
          <LoadingButton
            type="primary"
            className="auth-submit-btn"
            block
            onClick={() => navigate('/login')}
          >
            로그인으로 돌아가기
          </LoadingButton>
        </div>
      </div>
    </div>
  )
}
