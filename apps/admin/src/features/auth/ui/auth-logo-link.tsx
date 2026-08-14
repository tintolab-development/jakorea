import { Link } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { JaKoreaLogo } from '@/shared/ui/icons/ja-korea-logo'

interface AuthLogoLinkProps {
  wrapperClassName?: string
  logoClassName?: string
}

export function AuthLogoLink({
  wrapperClassName = 'auth-logo-wrapper',
  logoClassName = 'auth-logo',
}: AuthLogoLinkProps) {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)
  const homePath = isAuthenticated ? '/' : '/login'

  return (
    <div className={wrapperClassName}>
      <Link to={homePath} className="auth-logo-link" aria-label="JA Korea 홈으로 이동">
        <JaKoreaLogo className={logoClassName} />
      </Link>
    </div>
  )
}
