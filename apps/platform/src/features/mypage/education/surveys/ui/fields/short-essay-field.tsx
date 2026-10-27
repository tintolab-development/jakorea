import type {
  SessionPlanShortEssayParagraph,
  ShortEssayParagraph,
} from '@jakorea/form-schema/writing-form'
import type { FormUpdateParagraph } from '@jakorea/form-template-runtime'
import { PFTextarea } from '@/shared/ui'
import styles from '../survey-fields.module.css'

type SurveyShortEssayFieldProps = {
  paragraph: ShortEssayParagraph | SessionPlanShortEssayParagraph
  onUpdateParagraph: FormUpdateParagraph
  disabled?: boolean
}

export function SurveyShortEssayField({
  paragraph,
  onUpdateParagraph,
  disabled = false,
}: SurveyShortEssayFieldProps) {
  const placeholder = paragraph.bodyPlaceholder || '질문을 입력해 주세요'
  const items = paragraph.items ?? []
  const rows = paragraph.variant === 'short_essay' ? paragraph.itemInputRows ?? 1 : 4
  const showItemTitle = paragraph.showItemTitle !== false

  if (items.length === 0) {
    return (
      <div className={styles.surveyFields}>
        <PFTextarea
          variant="formPage"
          rows={rows}
          placeholder={placeholder}
          value={paragraph.bodyText}
          disabled={disabled}
          onValueChange={next => {
            onUpdateParagraph(paragraph.id, current =>
              current.kind === 'single_item' &&
              (current.variant === 'short_essay' || current.variant === 'session_plan_short_essay')
                ? { ...current, bodyText: next }
                : current,
            )
          }}
        />
      </div>
    )
  }

  return (
    <div className={styles.questionList}>
      {items.map((item, index) => {
        const label = showItemTitle ? item.label?.trim() : ''
        const titleHint =
          showItemTitle && 'titleHint' in item && typeof item.titleHint === 'string'
            ? item.titleHint.trim()
            : ''

        return (
          <div className={styles.questionItem} key={item.id}>
            {label || titleHint ? (
              <div className={styles.questionHeader}>
                {label ? <strong>{label}</strong> : <strong>문항 {index + 1}</strong>}
                {titleHint ? <span>{titleHint}</span> : null}
              </div>
            ) : null}
            <PFTextarea
              variant="formPage"
              rows={rows}
              aria-label={label || `${paragraph.paragraphTitle || '문항'} ${index + 1}`}
              placeholder={item.placeholder || placeholder}
              value={item.bodyText}
              disabled={disabled}
              onValueChange={next => {
                onUpdateParagraph(paragraph.id, current => {
                  if (
                    current.kind !== 'single_item' ||
                    (current.variant !== 'short_essay' && current.variant !== 'session_plan_short_essay')
                  ) {
                    return current
                  }
                  return {
                    ...current,
                    bodyText: current.items?.[0]?.id === item.id ? next : current.bodyText,
                    items: (current.items ?? []).map(entry =>
                      entry.id === item.id ? { ...entry, bodyText: next } : entry,
                    ),
                  }
                })
              }}
            />
          </div>
        )
      })}
    </div>
  )
}
