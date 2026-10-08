import { PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-volunteer-draft'
import {
  PFFormField,
  PFFormFieldRow,
  PFFormFieldTable,
  PFFormInlineRow,
  PFFormInlineSegment,
  PFFormInlineSeparator,
  PFTextInput,
} from '@/shared/ui'
import {
  ApplyVolunteerEvidenceAttach,
  type ApplyVolunteerEvidenceFile,
} from '../apply-volunteer-evidence-attach/apply-volunteer-evidence-attach'
import hostStyles from '../apply-form-field-host.module.css'
import styles from './apply-volunteer-previous-ja-program.module.css'

export type { ApplyVolunteerEvidenceFile }

/** CMS `application.volunteer.previousProgram.*` 와 동일 키 */
export type ApplyVolunteerPreviousJaProgramValues = {
  applicationYear: string
  programName: string
}

type ApplyVolunteerPreviousJaProgramProps = {
  value: ApplyVolunteerPreviousJaProgramValues
  onChange: (next: ApplyVolunteerPreviousJaProgramValues) => void
  evidenceFiles: readonly ApplyVolunteerEvidenceFile[]
  onEvidenceFilesChange: (next: ApplyVolunteerEvidenceFile[]) => void
  onEvidenceUploadingChange?: (uploading: boolean) => void
}

export function emptyVolunteerPreviousJaProgram(): ApplyVolunteerPreviousJaProgramValues {
  return { applicationYear: '', programName: '' }
}

export function findIncompleteVolunteerPreviousJaProgramMessage(
  values: ApplyVolunteerPreviousJaProgramValues,
): string | null {
  if (!/^\d{4}$/.test(values.applicationYear.trim())) {
    return '이전 참여 JA 봉사 프로그램의 진행년도를 4자리 숫자로 입력해 주세요.'
  }
  if (!values.programName.trim()) return '이전 참여 JA 봉사 프로그램명을 입력해 주세요.'
  return null
}

export function volunteerPreviousJaProgramAnswerFromValues(
  values: ApplyVolunteerPreviousJaProgramValues,
): Record<string, unknown> {
  return {
    applicationYear: values.applicationYear.trim(),
    programName: values.programName.trim(),
  }
}

export function volunteerPreviousJaProgramValuesFromDraftAnswer(
  answer: unknown,
): ApplyVolunteerPreviousJaProgramValues | null {
  if (!answer || typeof answer !== 'object' || Array.isArray(answer)) return null
  const row = answer as Record<string, unknown>
  const applicationYear = typeof row.applicationYear === 'string' ? row.applicationYear : ''
  const programName = typeof row.programName === 'string' ? row.programName : ''
  if (!applicationYear && !programName) return null
  return { applicationYear, programName }
}

export function ApplyVolunteerPreviousJaProgram({
  value,
  onChange,
  evidenceFiles,
  onEvidenceFilesChange,
  onEvidenceUploadingChange,
}: ApplyVolunteerPreviousJaProgramProps) {
  return (
    <PFFormFieldTable className={[styles.root, hostStyles.root].join(' ')}>
      <PFFormFieldRow type="single">
        <PFFormField label="참여 JA 봉사 프로그램" fullWidth labelWidth="wider">
          <PFFormInlineRow>
            <PFFormInlineSegment>
              <PFTextInput
                variant="formPage"
                size="large"
                width={200}
                inputMode="numeric"
                maxLength={4}
                placeholder="진행년도"
                value={value.applicationYear}
                onValueChange={next =>
                  onChange({ ...value, applicationYear: next.replace(/[^\d]/g, '') })
                }
              />
            </PFFormInlineSegment>
            <PFFormInlineSeparator />
            <PFFormInlineSegment className={styles.growSegment}>
              <PFTextInput
                variant="formPage"
                size="large"
                width="100%"
                placeholder="프로그램명"
                value={value.programName}
                onValueChange={next => onChange({ ...value, programName: next })}
              />
            </PFFormInlineSegment>
          </PFFormInlineRow>
        </PFFormField>
      </PFFormFieldRow>
      <PFFormFieldRow type="single">
        <PFFormField label="증빙서류 첨부" fullWidth labelWidth="wider">
          <ApplyVolunteerEvidenceAttach
            questionKey={PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.previousJaProgram}
            files={evidenceFiles}
            onChange={onEvidenceFilesChange}
            onUploadingChange={onEvidenceUploadingChange}
          />
        </PFFormField>
      </PFFormFieldRow>
    </PFFormFieldTable>
  )
}
