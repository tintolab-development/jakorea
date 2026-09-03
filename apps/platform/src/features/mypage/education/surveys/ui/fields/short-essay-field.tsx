import type { ShortEssayParagraph } from '@jakorea/form-schema/writing-form'
import type { FormUpdateParagraph } from '@jakorea/form-template-runtime'
import { PFTextarea } from '@/shared/ui'
import styles from '../survey-fields.module.css'

type SurveyShortEssayFieldProps = {
  paragraph: ShortEssayParagraph
  onUpdateParagraph: FormUpdateParagraph
}

export function SurveyShortEssayField({ paragraph, onUpdateParagraph }: SurveyShortEssayFieldProps) {
  const placeholder = paragraph.bodyPlaceholder || '질문을 입력해 주세요'
  const items = paragraph.items ?? []

  if (items.length === 0) {
    return (
      <div className={styles.surveyFields}>
        <PFTextarea
          variant="formPage"
          placeholder={placeholder}
          value={paragraph.bodyText}
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
    <div className={styles.surveyFields}>
      {items.map(item => (
        <PFTextarea
          key={item.id}
          variant="formPage"
          placeholder={item.placeholder || placeholder}
          value={item.bodyText}
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
      ))}
    </div>
  )
}
