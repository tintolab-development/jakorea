import type { ReactNode } from 'react'
import './paragraph-card.css'

export interface ParagraphCardProps {
  className?: string
  onClick?: () => void
  /** 카드 헤더 우측(예: 드래그 핸들) — 타이틀과 같은 줄에 정렬 */
  actionSlot?: ReactNode
  /** 상단 타이틀 영역 */
  title?: ReactNode
  /** 상단 설명 영역 */
  description?: ReactNode
  /** 중앙 본문 슬롯 */
  children?: ReactNode
  /** 하단 좌측(토글 등) */
  toggles?: ReactNode
  /** 하단 우측(단락 액션 버튼 등) */
  actions?: ReactNode
}

export function ParagraphCard({
  className,
  onClick,
  actionSlot,
  title,
  description,
  children,
  toggles,
  actions,
}: ParagraphCardProps) {
  const showFooter = toggles != null || actions != null

  return (
    <section className={['paragraph-card', className].filter(Boolean).join(' ')} onClick={onClick}>
      <div className="paragraph-card__header">
        {actionSlot ? (
          <div className="paragraph-card__header-title-row">
            <div className="paragraph-card__title-block">{title != null ? title : null}</div>
            <div className="paragraph-card__action-slot-wrap">{actionSlot}</div>
          </div>
        ) : title != null ? (
          <div className="paragraph-card__title-block">{title}</div>
        ) : null}
        {description != null ? (
          <div className="paragraph-card__description-block">{description}</div>
        ) : null}
      </div>
      {children != null ? <div className="paragraph-card__slot">{children}</div> : null}
      {showFooter ? (
        <footer className="paragraph-card__footer">
          <div className="paragraph-card__toggles">{toggles}</div>
          <div className="paragraph-card__actions-row">{actions}</div>
        </footer>
      ) : null}
    </section>
  )
}
