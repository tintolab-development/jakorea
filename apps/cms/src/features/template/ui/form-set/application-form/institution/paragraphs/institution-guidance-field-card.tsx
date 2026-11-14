import { useId } from 'react'
import {
  INSTITUTION_GUIDANCE_ANSWER_MAX_LENGTH,
  INSTITUTION_GUIDANCE_ANSWER_PLACEHOLDER,
  type InstitutionGuidanceFieldDefinition,
} from '@/features/template/lib/institution-guidance-field-definitions'
import { CmsTextArea } from '@/shared/ui/cms-textarea'
import './institution-guidance-field-card.css'
import { useIsTemplateManagementScreen } from '@/features/template/ui/template-management/detail-view-mode-context'

export function InstitutionGuidanceFieldCard({
  field,
  value,
  onChange,
}: {
  field: InstitutionGuidanceFieldDefinition
  value: string
  onChange?: (value: string) => void
}) {
  /** 템플릿 관리 시안(12875:513810·16268:599820) — 테두리 #e0e0e0·radius 12·헤더 아래 구분선·답변 칸 40 */
  const isTemplateManagementScreen = useIsTemplateManagementScreen()
  const uid = useId()
  const controlId = `institution-guidance-${field.id}-${uid}`
  const labelId = `${controlId}-label`

  return (
    <div
      className={[
        'institution-guidance-field-card',
        isTemplateManagementScreen && 'institution-guidance-field-card--spec',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="institution-guidance-field-card__header" id={labelId}>
        <div className="institution-guidance-field-card__label-row">
          <span className="institution-guidance-field-card__title">{field.title}</span>
          <span className="institution-guidance-field-card__description">{field.description}</span>
        </div>
      </div>
      <div className="institution-guidance-field-card__body">
        <CmsTextArea
          id={controlId}
          aria-labelledby={labelId}
          inputSize="small"
          width="100%"
          rows={1}
          expandableFromSingleRow
          placeholder={INSTITUTION_GUIDANCE_ANSWER_PLACEHOLDER}
          maxLength={INSTITUTION_GUIDANCE_ANSWER_MAX_LENGTH}
          value={value}
          onChange={onChange ? event => onChange(event.target.value) : undefined}
        />
      </div>
    </div>
  )
}
