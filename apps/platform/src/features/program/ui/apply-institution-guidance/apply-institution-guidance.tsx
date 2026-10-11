import {
  INSTITUTION_GUIDANCE_ANSWER_MAX_LENGTH,
  INSTITUTION_GUIDANCE_ANSWER_PLACEHOLDER,
  INSTITUTION_GUIDANCE_FIELDS,
  type InstitutionGuidanceFieldId,
} from '@jakorea/form-schema/paragraph-ids/program-application-form-institution-draft'
import {
  PFFormField,
  PFFormFieldHintText,
  PFFormFieldRow,
  PFFormFieldTable,
  PFTextarea,
} from '@/shared/ui'
import hostStyles from '../apply-form-field-host.module.css'
import styles from './apply-institution-guidance.module.css'

export type ApplyInstitutionGuidanceAnswers = Record<InstitutionGuidanceFieldId, string>

export function emptyInstitutionGuidanceAnswers(): ApplyInstitutionGuidanceAnswers {
  return Object.fromEntries(INSTITUTION_GUIDANCE_FIELDS.map(field => [field.id, ''])) as ApplyInstitutionGuidanceAnswers
}

export function guidanceAnswerFromValues(
  values: ApplyInstitutionGuidanceAnswers,
): Record<string, string> {
  return Object.fromEntries(
    INSTITUTION_GUIDANCE_FIELDS.map(field => [field.id, (values[field.id] ?? '').trim()]),
  )
}

export function guidanceValuesFromDraftAnswer(
  answer: unknown,
): ApplyInstitutionGuidanceAnswers | null {
  if (!answer || typeof answer !== 'object' || Array.isArray(answer)) return null
  const row = answer as Record<string, unknown>
  const next = emptyInstitutionGuidanceAnswers()
  let hasValue = false
  for (const field of INSTITUTION_GUIDANCE_FIELDS) {
    const raw = row[field.id]
    if (typeof raw === 'string') {
      next[field.id] = raw
      if (raw.trim()) hasValue = true
    }
  }
  return hasValue ? next : null
}

type ApplyInstitutionGuidanceProps = {
  value: ApplyInstitutionGuidanceAnswers
  onChange: (next: ApplyInstitutionGuidanceAnswers) => void
}

/** CMS 안내 사항 카드와 동일 항목·문구 — 자유 작성 단락과 같은 PFFormField 세로형 표 */
export function ApplyInstitutionGuidance({ value, onChange }: ApplyInstitutionGuidanceProps) {
  return (
    <div className={[styles.root, hostStyles.root, hostStyles.vertical].join(' ')}>
      {INSTITUTION_GUIDANCE_FIELDS.map(field => (
        <PFFormFieldTable key={field.id}>
          <PFFormFieldRow type="single">
            <PFFormField label={field.title} layout="vertical">
              <div className={styles.answer}>
                <PFFormFieldHintText as="p">{field.description}</PFFormFieldHintText>
                <PFTextarea
                  variant="formPage"
                  width="100%"
                  aria-label={field.title}
                  maxLength={INSTITUTION_GUIDANCE_ANSWER_MAX_LENGTH}
                  placeholder={INSTITUTION_GUIDANCE_ANSWER_PLACEHOLDER}
                  value={value[field.id] ?? ''}
                  message={`${(value[field.id] ?? '').length}/${INSTITUTION_GUIDANCE_ANSWER_MAX_LENGTH}`}
                  onValueChange={next => onChange({ ...value, [field.id]: next })}
                />
              </div>
            </PFFormField>
          </PFFormFieldRow>
        </PFFormFieldTable>
      ))}
    </div>
  )
}
