import type { ScaleTypeParagraph } from '@jakorea/form-schema/writing-form'
import { createDefaultScaleTypeItems } from '@jakorea/form-schema/writing-form'
import type { FormUpdateParagraph } from '@jakorea/form-template-runtime'
import styles from '../survey-fields.module.css'

type SurveyScaleTypeFieldProps = {
  paragraph: ScaleTypeParagraph
  onUpdateParagraph: FormUpdateParagraph
}

export function SurveyScaleTypeField({ paragraph, onUpdateParagraph }: SurveyScaleTypeFieldProps) {
  const items = paragraph.items?.length ? paragraph.items : createDefaultScaleTypeItems()
  const selectedId = paragraph.selectedPreviewItemId ?? null

  return (
    <div className={styles.scaleBar} role="group" aria-label="점수 선택">
      {items.map(item => (
        <button
          key={item.id}
          type="button"
          className={[
            styles.scaleItem,
            selectedId === item.id ? styles.scaleItemSelected : undefined,
          ]
            .filter(Boolean)
            .join(' ')}
          aria-pressed={selectedId === item.id}
          onClick={() => {
            onUpdateParagraph(paragraph.id, current =>
              current.kind === 'single_item' && current.variant === 'scale_type'
                ? { ...current, selectedPreviewItemId: item.id }
                : current,
            )
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
