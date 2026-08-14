import type { ReactNode } from 'react'

interface AuthFormLabelProps {
  children: ReactNode
}

export function AuthFormLabel({ children }: AuthFormLabelProps) {
  return (
    <span className="auth-label">
      {children}
      <span className="auth-required" aria-hidden>
        *
      </span>
    </span>
  )
}
