import type { ReactNode } from 'react'

interface RegisterStepHeaderProps {
  title: ReactNode
  description: ReactNode
}

export function RegisterStepHeader({ title, description }: RegisterStepHeaderProps) {
  return (
    <header className="register-step-header">
      <h1 className="register-step-header__title">{title}</h1>
      <p className="register-step-header__description">{description}</p>
    </header>
  )
}
