import {
  INSTRUCTOR_CRIME_RECORD_CONFIRM_INCOMPLETE_MESSAGE,
  INSTRUCTOR_CRIME_RECORD_CONFIRM_LABEL,
  INSTRUCTOR_CRIME_RECORD_GUIDE_CAUTION,
  INSTRUCTOR_CRIME_RECORD_GUIDE_INTRO,
  INSTRUCTOR_CRIME_RECORD_GUIDE_ITEMS,
} from '@jakorea/form-schema/program-application'
import { PFText } from '@/shared/ui'
import { ApplyFormRadioGroup } from '../apply-form-radio'
import styles from './apply-instructor-crime-record.module.css'

/** CMS `InstructorCrimeRecordParagraph` — 제출 방법 안내 고정 본문 + 확인 라디오 */
export type ApplyInstructorCrimeRecordValues = {
  confirmed: boolean
}

const CONFIRMED_VALUE = 'confirmed'
const CONFIRM_OPTIONS = [
  { value: CONFIRMED_VALUE, label: INSTRUCTOR_CRIME_RECORD_CONFIRM_LABEL },
] as const

export function emptyInstructorCrimeRecord(): ApplyInstructorCrimeRecordValues {
  return { confirmed: false }
}

export function findIncompleteInstructorCrimeRecordMessage(
  values: ApplyInstructorCrimeRecordValues,
): string | null {
  return values.confirmed ? null : INSTRUCTOR_CRIME_RECORD_CONFIRM_INCOMPLETE_MESSAGE
}

export function instructorCrimeRecordAnswerFromValues(
  values: ApplyInstructorCrimeRecordValues,
): Record<string, unknown> {
  return { confirmed: values.confirmed }
}

export function instructorCrimeRecordValuesFromDraftAnswer(
  answer: unknown,
): ApplyInstructorCrimeRecordValues | null {
  if (!answer || typeof answer !== 'object' || Array.isArray(answer)) return null
  const row = answer as Record<string, unknown>
  return { confirmed: row.confirmed === true }
}

type ApplyInstructorCrimeRecordProps = {
  value: ApplyInstructorCrimeRecordValues
  onChange: (next: ApplyInstructorCrimeRecordValues) => void
}

export function ApplyInstructorCrimeRecord({ value, onChange }: ApplyInstructorCrimeRecordProps) {
  return (
    <div className={styles.root}>
      <div className={styles.guideBody}>
        <PFText as="p" typo="bd-md-md" color="black">
          {INSTRUCTOR_CRIME_RECORD_GUIDE_INTRO}
        </PFText>
        <ul className={styles.guideList}>
          {INSTRUCTOR_CRIME_RECORD_GUIDE_ITEMS.map(item => (
            <li key={item.title}>
              <PFText as="p" typo="bd-md-md" color="black">
                {item.title}
              </PFText>
              <PFText as="p" typo="bd-md-md" color="black">
                {item.body}
              </PFText>
            </li>
          ))}
        </ul>
        <PFText as="p" typo="bd-md-md" color="black">
          {INSTRUCTOR_CRIME_RECORD_GUIDE_CAUTION}
        </PFText>
      </div>
      <div className={styles.confirm}>
        <ApplyFormRadioGroup
          name="apply-instructor-crime-record-confirm"
          value={value.confirmed ? CONFIRMED_VALUE : ''}
          options={CONFIRM_OPTIONS}
          onChange={next => onChange({ confirmed: next === CONFIRMED_VALUE })}
        />
      </div>
    </div>
  )
}
