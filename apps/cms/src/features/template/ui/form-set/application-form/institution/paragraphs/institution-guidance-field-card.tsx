import { useId } from 'react'
import {
  INSTITUTION_GUIDANCE_ANSWER_PLACEHOLDER,
  type InstitutionGuidanceFieldDefinition,
} from '@/features/template/lib/institution-guidance-field-definitions'
import { CmsTextArea } from '@/shared/ui/cms-textarea'
import './institution-guidance-field-card.css'

export function InstitutionGuidanceFieldCard({
  field,
  value,
  onChange,
}: {
  field: InstitutionGuidanceFieldDefinition
  value: string
  onChange?: (value: string) => void
}) {
  const uid = useId()
  const controlId = `institution-guidance-${field.id}-${uid}`
  const labelId = `${controlId}-label`

  return (
    <div className="institution-guidance-field-card">
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
          inputSize="medium"
          width="100%"
          rows={1}
          expandableFromSingleRow
          placeholder={INSTITUTION_GUIDANCE_ANSWER_PLACEHOLDER}
          value={value}
          onChange={onChange ? event => onChange(event.target.value) : undefined}
        />
      </div>
    </div>
  )
}
