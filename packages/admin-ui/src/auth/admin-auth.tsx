import type { ReactNode } from 'react'

import { joinClassNames } from '../lib/join-class-names.js'
import './admin-auth.css'

export interface AdminAuthPageProps {
  children: ReactNode
  className?: string
}

export interface AdminAuthCardProps {
  children: ReactNode
  className?: string
}

export interface AdminAuthFormLabelProps {
  children: ReactNode
}

export function AdminAuthPage({ children, className }: AdminAuthPageProps) {
  return <div className={joinClassNames('auth-page', className)}>{children}</div>
}

export function AdminAuthCard({ children, className }: AdminAuthCardProps) {
  return <div className={joinClassNames('auth-card', className)}>{children}</div>
}

export function AdminAuthFormLabel({ children }: AdminAuthFormLabelProps) {
  return (
    <span className="auth-label">
      {children}
      <span className="auth-required" aria-hidden>
        *
      </span>
    </span>
  )
}
