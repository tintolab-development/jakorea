import {
  PROGRAM_VOLUNTEER_FREE_TEXT_MAX_LENGTH,
  PROGRAM_VOLUNTEER_FREE_TEXT_QUESTIONS,
  type ProgramVolunteerFreeTextQuestion,
} from '@jakorea/form-schema/paragraph-ids/program-application-form-volunteer-draft'
import { PFFormField, PFFormFieldRow, PFFormFieldTable, PFTextarea } from '@/shared/ui'
import hostStyles from '../apply-form-field-host.module.css'
import styles from './apply-volunteer-free-text-items.module.css'

type QuestionId = ProgramVolunteerFreeTextQuestion['id']

export type ApplyVolunteerFreeTextItemsValues = Record<QuestionId, string>

type ApplyVolunteerFreeTextItemsProps = {
  value: ApplyVolunteerFreeTextItemsValues
  onChange: (next: ApplyVolunteerFreeTextItemsValues) => void
}

const PLACEHOLDER = '자유롭게 작성해 주세요'

export function emptyVolunteerFreeTextItems(): ApplyVolunteerFreeTextItemsValues {
  return { intro: '', educationExperience: '', necessity: '', jaExperience: '' }
}

export function findIncompleteVolunteerFreeTextItemsMessage(
  values: ApplyVolunteerFreeTextItemsValues,
): string | null {
  const missing = PROGRAM_VOLUNTEER_FREE_TEXT_QUESTIONS.find(q => !values[q.id].trim())
  return missing ? `자유 작성 항목 ${missing.label.split('.')[0]}번을 작성해 주세요.` : null
}

export function volunteerFreeTextItemsAnswerFromValues(
  values: ApplyVolunteerFreeTextItemsValues,
): Record<string, unknown> {
  return {
    items: PROGRAM_VOLUNTEER_FREE_TEXT_QUESTIONS.map(q => ({
      id: q.id,
      label: q.label,
      bodyText: values[q.id].trim(),
    })),
  }
}

export function volunteerFreeTextItemsValuesFromDraftAnswer(
  answer: unknown,
): ApplyVolunteerFreeTextItemsValues | null {
  if (!answer || typeof answer !== 'object' || Array.isArray(answer)) return null
  const items = (answer as Record<string, unknown>).items
  if (!Array.isArray(items)) return null
  const next = emptyVolunteerFreeTextItems()
  let found = false
  for (const item of items) {
    if (!item || typeof item !== 'object') continue
    const row = item as Record<string, unknown>
    const question = PROGRAM_VOLUNTEER_FREE_TEXT_QUESTIONS.find(q => q.id === row.id)
    if (!question || typeof row.bodyText !== 'string') continue
    next[question.id] = row.bodyText
    found = true
  }
  return found ? next : null
}

/** CMS `VolunteerFreeTextItemsParagraph` 와 같은 문항·글자 수 */
export function ApplyVolunteerFreeTextItems({ value, onChange }: ApplyVolunteerFreeTextItemsProps) {
  return (
    <div className={[styles.root, hostStyles.root, hostStyles.vertical].join(' ')}>
      {PROGRAM_VOLUNTEER_FREE_TEXT_QUESTIONS.map(question => (
        <PFFormFieldTable key={question.id}>
          <PFFormFieldRow type="single">
            <PFFormField
              label={question.label}
              labelDescription={question.hint}
              layout="vertical"
            >
              <div className={styles.answer}>
                <PFTextarea
                  variant="formPage"
                  width="100%"
                  aria-label={question.label}
                  maxLength={PROGRAM_VOLUNTEER_FREE_TEXT_MAX_LENGTH}
                  placeholder={PLACEHOLDER}
                  value={value[question.id]}
                  message={`${value[question.id].length}/${PROGRAM_VOLUNTEER_FREE_TEXT_MAX_LENGTH}`}
                  onValueChange={next => onChange({ ...value, [question.id]: next })}
                />
              </div>
            </PFFormField>
          </PFFormFieldRow>
        </PFFormFieldTable>
      ))}
    </div>
  )
}
