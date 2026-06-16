import type { ReactNode } from 'react'

import { JaKoreaLogo } from '@/shared/ui/icons/JaKoreaLogo'

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
        {showLogo ? (
          <div className="auth-logo-wrapper">
            <JaKoreaLogo className="auth-logo" />
          </div>
        ) : null}
        {children}
      </div>
    </div>
  )
}
