import type { ReactNode } from 'react'
import './template-list-card.css'

interface TemplateListCardProps {
  title: string
  description: string
  /** 섹션 건수 — 「등록 양식 총 4건 ｜ 설명」 (QA 261113 #2) */
  totalCount?: number
  children: ReactNode
  headerInline?: boolean
}

export function TemplateListCard({
  title,
  description,
  totalCount,
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
        {totalCount != null ? (
          <span className="template-list-card__count">총 {totalCount}건</span>
        ) : null}
        {totalCount != null && description !== '' ? (
          <span className="template-list-card__divider" aria-hidden="true">
            ｜
          </span>
        ) : null}
        <span className="info-section-desc">{description}</span>
      </div>
      {children}
    </section>
  )
}
