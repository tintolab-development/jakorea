import type { ReactNode } from 'react'
import './template-list-card.css'

interface TemplateListCardProps {
  title: string
  description: string
  children: ReactNode
}

export function TemplateListCard({ title, description, children }: TemplateListCardProps) {
  return (
    <section className="template-list-card">
      <div className="template-list-card__header">
        <span className="info-section-title">{title}</span>
        <span className="info-section-description">{description}</span>
      </div>
      {children}
    </section>
  )
}
