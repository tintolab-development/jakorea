import type { SessionPlanShortEssayParagraph } from '@/features/template/model/writing-form-draft.schema'
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
}: {
  paragraph: SessionPlanShortEssayParagraph
}) {
  const ph = safeTrim(paragraph.bodyPlaceholder) || '자유롭게 작성해 주세요'
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
    return (
      <div className="session-plan-short-essay-items">
        {items.map(item => (
          <div key={item.id} className="session-plan-short-essay-item-row">
            <div className="session-plan-short-essay-block">
              <div className="session-plan-short-essay-block__footer session-plan-short-essay-block__footer--document-readonly">
                <SessionPlanReadonlyText
                  text={safeTrim(item.bodyText)}
                  placeholder={safeTrim(item.placeholder) || ph}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="session-plan-short-essay-items">
      {items.map((item, index) => (
        <div key={item.id} className="session-plan-short-essay-block">
          <div className="session-plan-short-essay-block__header">
            <span className="session-plan-short-essay-block__title">
              {item.label ?? `Title ${String(index + 1).padStart(2, '0')}`}
            </span>
          </div>
          <div className="session-plan-short-essay-block__footer session-plan-short-essay-block__footer--document-readonly">
            <SessionPlanReadonlyText
              text={safeTrim(item.bodyText)}
              placeholder={safeTrim(item.placeholder) || ph}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
