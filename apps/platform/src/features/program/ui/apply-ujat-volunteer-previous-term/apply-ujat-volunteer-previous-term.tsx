import { UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS } from '@jakorea/form-schema/paragraph-ids/ujat-program-application-form-volunteer-draft'
import {
  PFFormControlCluster,
  PFFormControlSuffix,
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
import styles from './apply-ujat-volunteer-previous-term.module.css'

/** CMS `ujatVolunteerApplication.previousTerm` / `previousYear` */
export type ApplyUjatVolunteerPreviousTermValues = {
  activityTerm: string
  activityYear: string
}

type ApplyUjatVolunteerPreviousTermProps = {
  value: ApplyUjatVolunteerPreviousTermValues
  onChange: (next: ApplyUjatVolunteerPreviousTermValues) => void
  evidenceFiles: readonly ApplyVolunteerEvidenceFile[]
  onEvidenceFilesChange: (next: ApplyVolunteerEvidenceFile[]) => void
  onEvidenceUploadingChange?: (uploading: boolean) => void
}

export function emptyUjatVolunteerPreviousTerm(): ApplyUjatVolunteerPreviousTermValues {
  return { activityTerm: '', activityYear: '' }
}

export function findIncompleteUjatVolunteerPreviousTermMessage(
  values: ApplyUjatVolunteerPreviousTermValues,
): string | null {
  if (!values.activityTerm.trim()) return '이전 UJAT 활동 기수를 입력해 주세요.'
  if (!/^\d{4}$/.test(values.activityYear.trim())) {
    return '이전 UJAT 활동 년도를 4자리 숫자로 입력해 주세요.'
  }
  return null
}

export function ujatVolunteerPreviousTermAnswerFromValues(
  values: ApplyUjatVolunteerPreviousTermValues,
): Record<string, unknown> {
  return {
    activityTerm: values.activityTerm.trim(),
    activityYear: values.activityYear.trim(),
  }
}

export function ujatVolunteerPreviousTermValuesFromDraftAnswer(
  answer: unknown,
): ApplyUjatVolunteerPreviousTermValues | null {
  if (!answer || typeof answer !== 'object' || Array.isArray(answer)) return null
  const row = answer as Record<string, unknown>
  const activityTerm = typeof row.activityTerm === 'string' ? row.activityTerm : ''
  const activityYear = typeof row.activityYear === 'string' ? row.activityYear : ''
  if (!activityTerm && !activityYear) return null
  return { activityTerm, activityYear }
}

/** CMS `UjatProgramApplicationVolunteerPreviousTermParagraph` — 기수 · 년도 */
export function ApplyUjatVolunteerPreviousTerm({
  value,
  onChange,
  evidenceFiles,
  onEvidenceFilesChange,
  onEvidenceUploadingChange,
}: ApplyUjatVolunteerPreviousTermProps) {
  return (
    <PFFormFieldTable className={[styles.root, hostStyles.root].join(' ')}>
      <PFFormFieldRow type="single">
        <PFFormField label="이전 활동 기수 및 년도" fullWidth labelWidth="wide">
          <PFFormInlineRow>
            <PFFormInlineSegment>
              <PFFormControlCluster>
                <PFTextInput
                  variant="formPage"
                  size="large"
                  width={240}
                  inputMode="numeric"
                  placeholder="활동 기수"
                  value={value.activityTerm}
                  onValueChange={next =>
                    onChange({ ...value, activityTerm: next.replace(/[^\d]/g, '') })
                  }
                />
                <PFFormControlSuffix>기</PFFormControlSuffix>
              </PFFormControlCluster>
            </PFFormInlineSegment>
            <PFFormInlineSeparator />
            <PFFormInlineSegment>
              <PFFormControlCluster>
                <PFTextInput
                  variant="formPage"
                  size="large"
                  width={240}
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="활동 년도"
                  value={value.activityYear}
                  onValueChange={next =>
                    onChange({ ...value, activityYear: next.replace(/[^\d]/g, '') })
                  }
                />
                <PFFormControlSuffix>년</PFFormControlSuffix>
              </PFFormControlCluster>
            </PFFormInlineSegment>
          </PFFormInlineRow>
        </PFFormField>
      </PFFormFieldRow>
      <PFFormFieldRow type="single">
        <PFFormField label="수료증 첨부" fullWidth labelWidth="wide">
          <ApplyVolunteerEvidenceAttach
            questionKey={UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.previousTerm}
            files={evidenceFiles}
            onChange={onEvidenceFilesChange}
            onUploadingChange={onEvidenceUploadingChange}
          />
        </PFFormField>
      </PFFormFieldRow>
    </PFFormFieldTable>
  )
}
