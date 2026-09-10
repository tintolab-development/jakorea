import type { SessionPlanShortEssayParagraph } from '@/features/template/model/writing-form-draft.schema'
import { SessionPlanItemTitle } from '@/features/template/ui/paragraph/single-item/session-plan-item-title'
import '@/features/template/ui/paragraph/single-item/session-plan-short-essay.css'
import './document-session-plan-short-essay-readonly.css'

function safeTrim(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function SessionPlanReadonlyText({
  text,
  placeholder,
}: {
  text: string
  placeholder: string
}) {
  const display = text.length > 0 ? text : placeholder
  return (
    <div className="document-session-plan-short-essay-readonly__text">{display}</div>
  )
}

/** A4 contentOnly — 작성 모드 `SessionPlanShortEssay`와 동일 블록(헤더·border·bg) */
export function DocumentSessionPlanShortEssayReadonly({
  paragraph,
  emptyDisplayText,
}: {
  paragraph: SessionPlanShortEssayParagraph
  /** 미작성 미리보기 본문 — UJAT 교육계획서·교육일지는 `작성된 내용` */
  emptyDisplayText?: string
}) {
  const ph =
    safeTrim(emptyDisplayText) ||
    safeTrim(paragraph.bodyPlaceholder) ||
    '자유롭게 작성해 주세요'
  const items =
    paragraph.items && paragraph.items.length > 0
      ? paragraph.items
      : [
          {
            id: 'session-plan-item-1',
            label: 'Title 01',
            placeholder: ph,
            bodyText: paragraph.bodyText,
          },
        ]
  const showItemTitle = items.length >= 2 ? true : (paragraph.showItemTitle ?? false)

  if (!showItemTitle) {
    const item = items[0]
    const written = item ? safeTrim(item.bodyText) : ''
    const filled = written.length > 0
    const displayText = filled
      ? written
      : safeTrim(item?.placeholder) || ph
    return (
      <div
        className={[
          'form-document-preview-paragraph__body-text',
          filled
            ? 'form-document-preview-paragraph__body-text--plain-filled'
            : 'form-document-preview-paragraph__body-text--plain-placeholder',
        ].join(' ')}
      >
        {displayText}
      </div>
    )
  }

  return (
    <div className="session-plan-short-essay-items">
      {items.map((item, index) => {
        const labelText = item.label ?? `Title ${String(index + 1).padStart(2, '0')}`
        return (
        <div key={item.id} className="session-plan-short-essay-block">
          <div className="session-plan-short-essay-block__header">
            <SessionPlanItemTitle
              itemId={item.id}
              label={labelText}
              titleHint={item.titleHint}
            />
          </div>
          <div className="session-plan-short-essay-block__footer session-plan-short-essay-block__footer--document-readonly">
            <SessionPlanReadonlyText
              text={safeTrim(item.bodyText)}
              placeholder={safeTrim(item.placeholder) || ph}
            />
          </div>
        </div>
        )
      })}
    </div>
  )
}
