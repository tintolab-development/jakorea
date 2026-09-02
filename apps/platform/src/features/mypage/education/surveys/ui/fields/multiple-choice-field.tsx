import type { MultipleChoiceParagraph } from '@jakorea/form-schema/writing-form'
import type { FormUpdateParagraph } from '@jakorea/form-template-runtime'
import { PFCheckbox } from '@/shared/ui'
import styles from '../survey-fields.module.css'

type SurveyMultipleChoiceFieldProps = {
  paragraph: MultipleChoiceParagraph
  onUpdateParagraph: FormUpdateParagraph
}

export function SurveyMultipleChoiceField({
  paragraph,
  onUpdateParagraph,
}: SurveyMultipleChoiceFieldProps) {
  const allowMultiple = paragraph.allowMultiple === true
  const selectedIds = paragraph.selectedPreviewMultipleIds ?? []

  if (allowMultiple) {
    return (
      <div className={styles.checkboxStack}>
        {paragraph.items.map(item => (
          <PFCheckbox
            key={item.id}
            checked={selectedIds.includes(item.id)}
            onCheckedChange={checked => {
              onUpdateParagraph(paragraph.id, current => {
                if (current.kind !== 'single_item' || current.variant !== 'multiple_choice') {
                  return current
                }
                const prev = current.selectedPreviewMultipleIds ?? []
                const next = checked
                  ? [...prev.filter(id => id !== item.id), item.id]
                  : prev.filter(id => id !== item.id)
                return { ...current, selectedPreviewMultipleIds: next }
              })
            }}
          >
            {item.label}
          </PFCheckbox>
        ))}
      </div>
    )
  }

  return (
    <div className={styles.checkboxStack}>
      {paragraph.items.map(item => (
        <PFCheckbox
          key={item.id}
          checked={paragraph.selectedPreviewSingleId === item.id}
          onCheckedChange={checked => {
            if (!checked) return
            onUpdateParagraph(paragraph.id, current =>
              current.kind === 'single_item' && current.variant === 'multiple_choice'
                ? { ...current, selectedPreviewSingleId: item.id }
                : current,
            )
          }}
        >
          {item.label}
        </PFCheckbox>
      ))}
    </div>
  )
}
