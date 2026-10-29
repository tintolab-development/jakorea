import type { ReactNode } from 'react'
import { AdminAuthCard, AdminAuthPage } from '@jakorea/admin-ui'

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
  return (
    <AdminAuthPage>
      <AdminAuthCard className={cardClassName}>
        {showLogo ? <AuthLogoLink /> : null}
        {children}
      </AdminAuthCard>
    </AdminAuthPage>
  )
}
