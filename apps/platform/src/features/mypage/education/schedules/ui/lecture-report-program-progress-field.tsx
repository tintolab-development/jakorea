import type { LectureReportProgramProgressParagraph } from '@jakorea/form-schema/writing-form'
import type { FormUpdateParagraph } from '@jakorea/form-template-runtime'
import { formatDisplayDate, toSeoulDateOnly } from '@/shared/lib/format-display-date'
import {
  PFFormField,
  PFFormFieldRow,
  PFFormFieldTable,
  PFFormInlineSeparator,
  PFFormPeriodPair,
  PFTextInput,
} from '@/shared/ui'
import styles from './lecture-report-program-progress-field.module.css'

export type LectureReportProgramProgressFieldProps = {
  paragraph: LectureReportProgramProgressParagraph
  onUpdateParagraph?: FormUpdateParagraph
  readOnly?: boolean
}

function displayValue(value: string | undefined): string {
  return value?.trim() || ''
}

function formatEducationDate(value: string | undefined): string {
  const trimmed = value?.trim() ?? ''
  if (!trimmed) return ''
  const dateOnly = toSeoulDateOnly(trimmed)
  const label = formatDisplayDate(dateOnly ?? trimmed)
  return label || trimmed
}

export function LectureReportProgramProgressField({
  paragraph,
  onUpdateParagraph,
  readOnly = false,
}: LectureReportProgramProgressFieldProps) {
  const autofillLocked = true
  const progressUnitEditable = !readOnly

  const patchProgressUnit = (next: string) => {
    if (!progressUnitEditable || !onUpdateParagraph) return
    onUpdateParagraph(paragraph.id, current =>
      current.kind === 'single_item' && current.variant === 'lecture_report_program_progress'
        ? { ...current, progressUnit: next }
        : current,
    )
  }

  return (
    <PFFormFieldTable className={styles.table}>
      <PFFormFieldRow type="double">
        <PFFormField label="프로그램명">
          <PFTextInput
            variant="formPage"
            size="large"
            value={displayValue(paragraph.programName)}
            disabled={autofillLocked}
            placeholder="프로그램명"
            aria-label="프로그램명"
            readOnly
          />
        </PFFormField>
        <PFFormField label="사용교재 및 진행단원">
          <PFFormPeriodPair className={styles.splitPair}>
            <PFTextInput
              variant="formPage"
              size="large"
              value={displayValue(paragraph.textbookName)}
              disabled={autofillLocked}
              placeholder="교재명"
              aria-label="교재명"
              readOnly
            />
            <PFFormInlineSeparator />
            <PFTextInput
              variant="formPage"
              size="large"
              value={displayValue(paragraph.progressUnit)}
              disabled={!progressUnitEditable}
              placeholder="진행 단원"
              aria-label="진행 단원"
              onValueChange={patchProgressUnit}
            />
          </PFFormPeriodPair>
        </PFFormField>
      </PFFormFieldRow>

      <PFFormFieldRow type="double">
        <PFFormField label="기관명">
          <PFTextInput
            variant="formPage"
            size="large"
            value={displayValue(paragraph.institutionName)}
            disabled={autofillLocked}
            placeholder="기관명"
            aria-label="기관명"
            readOnly
          />
        </PFFormField>
        <PFFormField label="기관 소재지">
          <PFTextInput
            variant="formPage"
            size="large"
            value={displayValue(paragraph.institutionLocation)}
            disabled={autofillLocked}
            placeholder="기관 소재지"
            aria-label="기관 소재지"
            readOnly
          />
        </PFFormField>
      </PFFormFieldRow>

      <PFFormFieldRow type="double">
        <PFFormField label="교육 진행일">
          <PFTextInput
            variant="formPage"
            size="large"
            value={formatEducationDate(paragraph.educationDate)}
            disabled={autofillLocked}
            placeholder="교육 진행일"
            aria-label="교육 진행일"
            readOnly
          />
        </PFFormField>
        <PFFormField label="교육 진행 시간(차시)">
          <PFFormPeriodPair className={styles.splitPair}>
            <PFTextInput
              variant="formPage"
              size="large"
              value={displayValue(paragraph.sessionTime)}
              disabled={autofillLocked}
              placeholder="교육 진행 시간"
              aria-label="교육 진행 시간"
              readOnly
            />
            <PFFormInlineSeparator />
            <PFTextInput
              variant="formPage"
              size="large"
              value={displayValue(paragraph.sessionIndex)}
              disabled={autofillLocked}
              placeholder="진행 차시"
              aria-label="진행 차시"
              readOnly
            />
          </PFFormPeriodPair>
        </PFFormField>
      </PFFormFieldRow>

      <PFFormFieldRow type="double">
        <PFFormField label="교육 대상">
          <PFTextInput
            variant="formPage"
            size="large"
            value={displayValue(paragraph.educationTarget)}
            disabled={autofillLocked}
            placeholder="교육 대상"
            aria-label="교육 대상"
            readOnly
          />
        </PFFormField>
        <PFFormField label="학급 및 학생 수">
          <PFFormPeriodPair className={styles.splitPair}>
            <PFTextInput
              variant="formPage"
              size="large"
              value={displayValue(paragraph.classLabel)}
              disabled={autofillLocked}
              placeholder="담당 학급(반)"
              aria-label="담당 학급(반)"
              readOnly
            />
            <PFFormInlineSeparator />
            <PFTextInput
              variant="formPage"
              size="large"
              value={displayValue(paragraph.studentCount)}
              disabled={autofillLocked}
              placeholder="총 학생 수"
              aria-label="총 학생 수"
              readOnly
            />
          </PFFormPeriodPair>
        </PFFormField>
      </PFFormFieldRow>
    </PFFormFieldTable>
  )
}
