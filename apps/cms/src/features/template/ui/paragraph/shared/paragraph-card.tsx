import type { ReactNode } from 'react'
import { ParagraphInput } from '@/features/template/ui/shared/paragraph-input'
import './paragraph-card.css'

/** 카드 헤더 제목·설명 — `ParagraphInput`으로 편집, 스키마 필드와 상위 `updateParagraph`에서 동기화 */
export interface ParagraphCardEditableHeading {
  isEditMode: boolean
  /** 미지정 시 `isEditMode`와 동일 */
  titleIsEditMode?: boolean
  /** 미지정 시 `isEditMode`와 동일 — 구조 잠금 단락에서 제목만 잠그고 설명은 편집할 때 사용 */
  descriptionIsEditMode?: boolean
  titleValue: string
  onTitleChange: (next: string) => void
  titlePlaceholder?: string
  titleRequired?: boolean
  /** 예: `paragraph-card__title--placeholder` */
  titleClassName?: string
  titleLeading?: ReactNode
  /** 제목 입력 우측(예: 단락별 액션 버튼) — `paragraph-card__title-block` 맨 오른쪽 */
  titleTrailing?: ReactNode
  descriptionValue: string
  onDescriptionChange: (next: string) => void
  descriptionPlaceholder?: string
  descriptionClassName?: string
  /** false면 카드 헤더에 설명란을 렌더하지 않음(제목만) */
  showDescription?: boolean
}

/** 읽기 전용 단락 제목 — `ParagraphInput`·필수(*) 마크업을 카드 헤더와 동일하게 쓴다 */
export function paragraphCardStaticHeading(
  title: string,
  options?: { required?: boolean }
): ParagraphCardEditableHeading {
  return {
    isEditMode: false,
    titleValue: title,
    onTitleChange: () => {},
    titleRequired: options?.required ?? false,
    descriptionValue: '',
    onDescriptionChange: () => {},
    showDescription: false,
  }
}

export interface ParagraphCardProps {
  className?: string
  onClick?: () => void
  /** DOM·스코프 스타일용 (`data-paragraph-id`) */
  dataParagraphId?: string
  /** 드래그 핸들 등 — 타이틀과 같은 줄, 타이틀 텍스트 바로 왼쪽 */
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
  dataParagraphId,
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
      const titleEditMode = h.titleIsEditMode ?? h.isEditMode
      const descriptionEditMode = h.descriptionIsEditMode ?? h.isEditMode
      /** view: 타이틀 내용 없으면 placeholder(「타이틀을 입력해 주세요」등) 영역 숨김 */
      const titleHasContent =
        (typeof h.titleValue === 'string' ? h.titleValue.trim() : '').length > 0
      const showTitle = titleEditMode || titleHasContent
      const titleInput = showTitle ? (
        <ParagraphInput
          type="title"
          isEditMode={titleEditMode}
          required={h.titleRequired}
          value={h.titleValue}
          onChange={h.onTitleChange}
          placeholder={h.titlePlaceholder ?? '타이틀을 입력해 주세요'}
          leading={h.titleLeading}
          className={h.titleClassName}
        />
      ) : null
      const descriptionInput = (
        <ParagraphInput
          type="description"
          isEditMode={descriptionEditMode}
          value={h.descriptionValue}
          onChange={h.onDescriptionChange}
          placeholder={h.descriptionPlaceholder ?? '설명 입력'}
          className={h.descriptionClassName}
        />
      )

      const showDescription = h.showDescription !== false

      const titleBlock =
        showTitle && titleInput != null ? (
          h.titleTrailing != null ? (
            <div className="paragraph-card__title-block paragraph-card__title-block--with-trailing">
              <div className="paragraph-card__title-main">{titleInput}</div>
              <div className="paragraph-card__title-trailing">{h.titleTrailing}</div>
            </div>
          ) : (
            <div className="paragraph-card__title-block">{titleInput}</div>
          )
        ) : null

      return (
        <>
          {actionSlot != null || titleBlock != null ? (
            actionSlot != null ? (
              <div className="paragraph-card__header-title-row">
                <div className="paragraph-card__action-slot-wrap">{actionSlot}</div>
                {titleBlock}
              </div>
            ) : (
              titleBlock
            )
          ) : null}
          {showDescription ? (
            <div className="paragraph-card__description-block">{descriptionInput}</div>
          ) : null}
        </>
      )
    }

    return (
      <>
        {actionSlot ? (
          <div className="paragraph-card__header-title-row">
            <div className="paragraph-card__action-slot-wrap">{actionSlot}</div>
            <div className="paragraph-card__title-block">{title != null ? title : null}</div>
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
    <section
      className={['paragraph-card', className].filter(Boolean).join(' ')}
      onClick={onClick}
      data-paragraph-id={dataParagraphId}
    >
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
