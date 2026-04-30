import type { ReactNode } from 'react'
import './template-list-card.css'

interface TemplateListCardProps {
  title: string
  description: string
  children: ReactNode
  headerInline?: boolean
}

export function TemplateListCard({
  title,
  description,
  children,
  headerInline = false,
}: TemplateListCardProps) {
  const headerClassName = [
    'template-list-card__header',
    headerInline ? 'template-list-card__header--inline' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <section className="template-list-card">
      <div className={headerClassName}>
        <span className="info-section-title">{title}</span>
        <span className="info-section-description">{description}</span>
      </div>
      {children}
    </section>
  )
}
