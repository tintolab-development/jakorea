import type { ReactNode } from 'react'

export type DsSectionProps = {
  id: string
  title: string
  description?: string
  children: ReactNode
}

export function DsSection({ id, title, description, children }: DsSectionProps) {
  return (
    <section id={id} className="ds-section">
      <header className="ds-section__header">
        <h2 className="ds-section__title">{title}</h2>
        {description ? <p className="ds-section__desc">{description}</p> : null}
      </header>
      {children}
    </section>
  )
}

export type DsDemoProps = {
  label: string
  children: ReactNode
  className?: string
}

export function DsDemo({ label, children, className }: DsDemoProps) {
  return (
    <div className={['ds-demo', className].filter(Boolean).join(' ')}>
      <p className="ds-demo__label">{label}</p>
      {children}
    </div>
  )
}
