import {
  PFFormControlCluster,
  PFFormControlSuffix,
  PFFormField,
  PFFormFieldRow,
  PFFormFieldTable,
  PFFormInlineRow,
  PFFormInlineSegment,
  PFText,
  PFTextInput,
} from '@/shared/ui'
import hostStyles from '../apply-form-field-host.module.css'
import styles from './apply-gemini-institution-info.module.css'

export type ApplyGeminiInstitutionTrainingInfoValues = {
  studentCount: string
}

export type ApplyGeminiInstitutionContactValues = {
  jobTitle: string
  subject: string
}

export function emptyGeminiInstitutionTrainingInfo(): ApplyGeminiInstitutionTrainingInfoValues {
  return { studentCount: '' }
}

export function emptyGeminiInstitutionContact(): ApplyGeminiInstitutionContactValues {
  return { jobTitle: '', subject: '' }
}

export function geminiInstitutionTrainingInfoAnswerFromValues(
  values: ApplyGeminiInstitutionTrainingInfoValues,
): Record<string, unknown> | null {
  const studentCount = Number.parseInt(values.studentCount, 10)
  if (!Number.isFinite(studentCount) || studentCount < 1) return null
  return { studentCount }
}

export function geminiInstitutionContactAnswerFromValues(
  values: ApplyGeminiInstitutionContactValues,
): Record<string, unknown> | null {
  const jobTitle = values.jobTitle.trim()
  const subject = values.subject.trim()
  if (!jobTitle && !subject) return null
  return { jobTitle, subject }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function readStringField(row: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const raw = row[key]
    if (typeof raw === 'string' && raw.trim()) return raw.trim()
    if (typeof raw === 'number' && Number.isFinite(raw)) return String(raw)
  }
  return ''
}

export function geminiInstitutionTrainingInfoValuesFromDraftAnswer(
  answer: unknown,
): ApplyGeminiInstitutionTrainingInfoValues | null {
  const row = asRecord(answer)
  if (!row) return null
  const studentCount = readStringField(row, 'studentCount', 'totalStudents', 'participantCount')
  return studentCount ? { studentCount } : null
}

export function geminiInstitutionContactValuesFromDraftAnswer(
  answer: unknown,
): ApplyGeminiInstitutionContactValues | null {
  const row = asRecord(answer)
  if (!row) return null
  const jobTitle = readStringField(row, 'jobTitle', 'position', 'rank')
  const subject = readStringField(row, 'subject', 'classSubject')
  return jobTitle || subject ? { jobTitle, subject } : null
}

export function findIncompleteGeminiInstitutionTrainingInfoMessage(
  values: ApplyGeminiInstitutionTrainingInfoValues,
): string | null {
  const studentCount = Number.parseInt(values.studentCount, 10)
  if (!Number.isFinite(studentCount) || studentCount < 1) {
    return '수강 인원을 입력해 주세요.'
  }
  if (studentCount < 15) {
    return '수강 인원은 15명 이상 입력해 주세요.'
  }
  return null
}

export function findIncompleteGeminiInstitutionContactMessage(
  values: ApplyGeminiInstitutionContactValues,
): string | null {
  if (!values.jobTitle.trim()) return '직급을 입력해 주세요.'
  if (!values.subject.trim()) return '담당 과목을 입력해 주세요.'
  return null
}

type ApplyGeminiInstitutionTrainingInfoProps = {
  value: ApplyGeminiInstitutionTrainingInfoValues
  onChange: (next: ApplyGeminiInstitutionTrainingInfoValues) => void
}

export function ApplyGeminiInstitutionTrainingInfo({
  value,
  onChange,
}: ApplyGeminiInstitutionTrainingInfoProps) {
  return (
    <PFFormFieldTable className={[styles.root, hostStyles.root].join(' ')}>
      <PFFormFieldRow type="single">
        <PFFormField label="수강 인원" fullWidth>
          <PFFormInlineRow>
            <PFFormInlineSegment>
              <PFFormControlCluster>
                <PFText as="span" typo="bd-md-md" color="black">
                  총
                </PFText>
                <span data-field="studentCount">
                  <PFTextInput
                    variant="formPage"
                    size="large"
                    width={120}
                    inputMode="numeric"
                    placeholder="총 학생 수"
                    value={value.studentCount}
                    onValueChange={next => onChange({ studentCount: next.replace(/\D/g, '') })}
                  />
                </span>
                <PFFormControlSuffix>명</PFFormControlSuffix>
              </PFFormControlCluster>
            </PFFormInlineSegment>
          </PFFormInlineRow>
        </PFFormField>
      </PFFormFieldRow>
    </PFFormFieldTable>
  )
}

type ApplyGeminiInstitutionContactProps = {
  value: ApplyGeminiInstitutionContactValues
  onChange: (next: ApplyGeminiInstitutionContactValues) => void
}

export function ApplyGeminiInstitutionContact({
  value,
  onChange,
}: ApplyGeminiInstitutionContactProps) {
  return (
    <PFFormFieldTable className={[styles.root, hostStyles.root].join(' ')}>
      <PFFormFieldRow type="double">
        <PFFormField label="직급">
          <PFTextInput
            variant="formPage"
            size="large"
            width="100%"
            placeholder="직급을 입력해 주세요"
            value={value.jobTitle}
            onValueChange={jobTitle => onChange({ ...value, jobTitle })}
          />
        </PFFormField>
        <PFFormField label="담당 과목">
          <PFTextInput
            variant="formPage"
            size="large"
            width="100%"
            placeholder="담당 과목을 입력해 주세요"
            value={value.subject}
            onValueChange={subject => onChange({ ...value, subject })}
          />
        </PFFormField>
      </PFFormFieldRow>
    </PFFormFieldTable>
  )
}
