import type { ReactNode } from 'react'

import { AuthLogoLink } from '@/features/auth/ui/auth-logo-link'

import '@/pages/auth/auth-shell.css'

interface AuthPageShellProps {
  children: ReactNode
  cardClassName?: string
  showLogo?: boolean
}

export function AuthPageShell({
  children,
  cardClassName,
  showLogo = true,
}: AuthPageShellProps) {
  const cardClass = cardClassName ? `auth-card ${cardClassName}` : 'auth-card'

  return (
    <div className="auth-page">
      <div className={cardClass}>
        {showLogo ? <AuthLogoLink /> : null}
        {children}
      </div>
    </div>
  )
}
