import type {
  SessionPlanShortEssayParagraph,
  ShortEssayParagraph,
} from '@jakorea/form-schema/writing-form'
import type { FormUpdateParagraph } from '@jakorea/form-template-runtime'
import hostStyles from '@/features/program/ui/apply-form-field-host.module.css'
import { PFFormField, PFFormFieldRow, PFFormFieldTable, PFTextarea } from '@/shared/ui'
import {
  PROGRAM_APPLICATION_FREE_TEXT_MAX_LENGTH,
  clipApplicationFreeText,
} from '@/features/program/lib/portal-application-free-text'
import styles from './short-essay-field.module.css'

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
  const rows =
    paragraph.variant === 'short_essay'
      ? paragraph.itemInputRows === 1
        ? 1
        : (paragraph.itemInputRows ?? 4)
      : 4
  const showItemTitle = paragraph.showItemTitle !== false
  const sectionAriaLabel = paragraph.paragraphTitle?.trim() || '답변'

  const essayTextarea = (props: {
    value: string
    placeholder: string
    ariaLabel: string
    onValueChange: (next: string) => void
  }) => (
    <div className={styles.answer}>
      <PFTextarea
        variant="formPage"
        width="100%"
        rows={rows}
        aria-label={props.ariaLabel}
        placeholder={props.placeholder}
        value={props.value}
        disabled={disabled}
        maxLength={PROGRAM_APPLICATION_FREE_TEXT_MAX_LENGTH}
        message={`${clipApplicationFreeText(props.value).length}/${PROGRAM_APPLICATION_FREE_TEXT_MAX_LENGTH}`}
        messageAlign="end"
        onValueChange={next => props.onValueChange(clipApplicationFreeText(next))}
      />
    </div>
  )

  if (items.length === 0) {
    return (
      <div className={styles.root}>
        {essayTextarea({
          value: paragraph.bodyText,
          placeholder,
          ariaLabel: sectionAriaLabel,
          onValueChange: next => {
            onUpdateParagraph(paragraph.id, current =>
              current.kind === 'single_item' &&
              (current.variant === 'short_essay' || current.variant === 'session_plan_short_essay')
                ? { ...current, bodyText: next }
                : current,
            )
          },
        })}
      </div>
    )
  }

  return (
    <div className={[styles.root, hostStyles.root, hostStyles.vertical].join(' ')}>
      {items.map((item, index) => {
        const label = showItemTitle ? item.label?.trim() : ''
        const titleHint =
          showItemTitle && 'titleHint' in item && typeof item.titleHint === 'string'
            ? item.titleHint.trim()
            : ''
        const patchItemBody = (next: string) => {
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
        }

        const textarea = essayTextarea({
          value: item.bodyText,
          placeholder: item.placeholder || placeholder,
          ariaLabel: label || `${sectionAriaLabel}${items.length > 1 ? ` ${index + 1}` : ''}`,
          onValueChange: patchItemBody,
        })

        if (!label) {
          return (
            <div key={item.id} className={styles.answerBare}>
              {textarea}
            </div>
          )
        }

        return (
          <PFFormFieldTable key={item.id}>
            <PFFormFieldRow type="single">
              <PFFormField label={label} labelDescription={titleHint || undefined} layout="vertical">
                {textarea}
              </PFFormField>
            </PFFormFieldRow>
          </PFFormFieldTable>
        )
      })}
    </div>
  )
}
