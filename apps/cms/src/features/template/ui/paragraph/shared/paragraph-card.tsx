import type { ReactNode } from 'react'
import { ParagraphInput } from '@/features/template/ui/paragraph/shared/paragraph-input'
import './paragraph-card.css'

/** 카드 헤더 제목·설명 — `ParagraphInput`으로 편집, 스키마 필드와 상위 `updateParagraph`에서 동기화 */
export interface ParagraphCardEditableHeading {
  isEditMode: boolean
  titleValue: string
  onTitleChange: (next: string) => void
  titlePlaceholder?: string
  titleRequired?: boolean
  /** 예: `paragraph-card__title--placeholder` */
  titleClassName?: string
  titleLeading?: ReactNode
  descriptionValue: string
  onDescriptionChange: (next: string) => void
  descriptionPlaceholder?: string
}

export interface ParagraphCardProps {
  className?: string
  onClick?: () => void
  /** 카드 헤더 우측(예: 드래그 핸들) — 타이틀과 같은 줄에 정렬 */
  actionSlot?: ReactNode
  /** 읽기 전용 헤더(미리보기 등). `editableHeading`이 있으면 무시됨 */
  title?: ReactNode
  /** 읽기 전용 헤더. `editableHeading`이 있으면 무시됨 */
  description?: ReactNode
  /** 폼 에디터: 제목/설명을 입력하고 단락 데이터에 반영 */
  editableHeading?: ParagraphCardEditableHeading
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
  editableHeading,
  children,
  toggles,
  actions,
}: ParagraphCardProps) {
  const showFooter = toggles != null || actions != null

  const renderHeading = () => {
    if (editableHeading) {
      const h = editableHeading
      const titleInput = (
        <ParagraphInput
          type="title"
          isEditMode={h.isEditMode}
          required={h.titleRequired}
          value={h.titleValue}
          onChange={h.onTitleChange}
          placeholder={h.titlePlaceholder ?? '타이틀을 입력해 주세요'}
          leading={h.titleLeading}
          className={h.titleClassName}
        />
      )
      const descriptionInput = (
        <ParagraphInput
          type="description"
          isEditMode={h.isEditMode}
          value={h.descriptionValue}
          onChange={h.onDescriptionChange}
          placeholder={h.descriptionPlaceholder ?? '설명 입력'}
        />
      )

      return (
        <>
          {actionSlot ? (
            <div className="paragraph-card__header-title-row">
              <div className="paragraph-card__title-block">{titleInput}</div>
              <div className="paragraph-card__action-slot-wrap">{actionSlot}</div>
            </div>
          ) : (
            <div className="paragraph-card__title-block">{titleInput}</div>
          )}
          <div className="paragraph-card__description-block">{descriptionInput}</div>
        </>
      )
    }

    return (
      <>
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
      </>
    )
  }

  return (
    <section className={['paragraph-card', className].filter(Boolean).join(' ')} onClick={onClick}>
      <div className="paragraph-card__header">{renderHeading()}</div>
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
