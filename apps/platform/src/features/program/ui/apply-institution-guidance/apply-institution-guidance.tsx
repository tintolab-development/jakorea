import {
  INSTITUTION_GUIDANCE_ANSWER_MAX_LENGTH,
  INSTITUTION_GUIDANCE_ANSWER_PLACEHOLDER,
  INSTITUTION_GUIDANCE_FIELDS,
  type InstitutionGuidanceFieldId,
} from '@jakorea/form-schema/paragraph-ids/program-application-form-institution-draft'
import { ParagraphCard } from '@/features/form-template'
import { PFFormField, PFFormFieldRow, PFFormFieldTable, PFTextarea } from '@/shared/ui'
import hostStyles from '../apply-form-field-host.module.css'
import { institutionGuidanceParagraphHeading } from './institution-guidance-paragraph-heading'
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
  /** 마이페이지 안내사항 작성 — 항목별 ParagraphCard */
  layout?: 'stacked' | 'paragraphCards'
}

function guidanceTextarea(
  field: (typeof INSTITUTION_GUIDANCE_FIELDS)[number],
  value: ApplyInstitutionGuidanceAnswers,
  onChange: (next: ApplyInstitutionGuidanceAnswers) => void,
  options?: { rows?: number },
) {
  return (
    <PFTextarea
      variant="formPage"
      size="large"
      rows={options?.rows}
      width="100%"
      aria-label={field.title}
      maxLength={INSTITUTION_GUIDANCE_ANSWER_MAX_LENGTH}
      placeholder={INSTITUTION_GUIDANCE_ANSWER_PLACEHOLDER}
      value={value[field.id] ?? ''}
      message={`${(value[field.id] ?? '').length}/${INSTITUTION_GUIDANCE_ANSWER_MAX_LENGTH}`}
      messageAlign="end"
      onValueChange={next => onChange({ ...value, [field.id]: next })}
    />
  )
}

/** CMS 안내 사항 카드와 동일 항목·문구 — 자유 작성 단락과 같은 PFFormField 세로형 표 */
export function ApplyInstitutionGuidance({
  value,
  onChange,
  layout = 'stacked',
}: ApplyInstitutionGuidanceProps) {
  if (layout === 'paragraphCards') {
    return (
      <>
        {INSTITUTION_GUIDANCE_FIELDS.map(field => (
          <ParagraphCard
            key={field.id}
            dataParagraphId={`institution-guidance-${field.id}`}
            editableHeading={institutionGuidanceParagraphHeading(field.title, field.description)}
          >
            {guidanceTextarea(field, value, onChange, { rows: 1 })}
          </ParagraphCard>
        ))}
      </>
    )
  }

  return (
    <div className={[styles.root, hostStyles.root, hostStyles.vertical].join(' ')}>
      {INSTITUTION_GUIDANCE_FIELDS.map(field => (
        <PFFormFieldTable key={field.id}>
          <PFFormFieldRow type="single">
            <PFFormField
              label={field.title}
              labelDescription={field.description}
              stackLabelDescription
              layout="vertical"
            >
              {guidanceTextarea(field, value, onChange)}
            </PFFormField>
          </PFFormFieldRow>
        </PFFormFieldTable>
      ))}
    </div>
  )
}
