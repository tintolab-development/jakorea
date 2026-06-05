import type { ReactNode } from 'react'
import { INSTRUCTOR_FEE_GRADE_OPTIONS } from '@/data/mock/program-wage-info'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { CmsSelect } from '@/shared/ui/cms-select'
import {
  withProgramDetailTdDivider,
  ProgramDetailTdSegmentWrap,
} from '@/features/program/shared/ui/program-detail-td-divider'
import type { ApplicantInstructorEditDraft } from '@/features/program/general/lib/applicant-instructor-detail-edit'
import {
  formatLectureFeeAmountInput,
  formatLectureFeeAmountWon,
  LECTURE_FEE_BASIS_TYPE_OPTIONS,
  LECTURE_FEE_MEASURE_OPTIONS,
  lectureFeeBasisTypeLabel,
  parseLectureFeeAmountDigits,
  resolveLectureFeeBasisFromRow,
  type ApplicantInstructorBusinessIncomeStatus,
  type ApplicantInstructorLectureFeeBasisType,
} from '@/features/program/general/lib/applicant-instructor-lecture-fee-basis'
import type { ApplicantInstructorRow } from '@/data/mock/applicant-instructors'

function FieldError({ message }: { message?: string }) {
  if (!message?.trim()) return null
  return (
    <span className="applicant-general-instructor-basic-info__field-error">{message}</span>
  )
}

export function LectureFeeBasisView({ instructor }: { instructor: ApplicantInstructorRow }) {
  const fee = resolveLectureFeeBasisFromRow(instructor)
  const display = instructor.lectureFeeBasisDisplay?.trim()

  if (fee.type === 'program') {
    return <span>{lectureFeeBasisTypeLabel('program')}</span>
  }

  const segments: ReactNode[] = [lectureFeeBasisTypeLabel(fee.type)]
  if (fee.measure.trim()) {
    segments.push(fee.measure.trim())
  }
  const amountLabel = formatLectureFeeAmountWon(fee.amount)
  if (amountLabel) {
    segments.push(amountLabel)
  }

  if (segments.length === 1 && display) {
    return (
      <ProgramDetailTdSegmentWrap>
        {display.includes('|')
          ? withProgramDetailTdDivider(display.split('|').map(s => s.trim()))
          : display}
      </ProgramDetailTdSegmentWrap>
    )
  }

  return (
    <ProgramDetailTdSegmentWrap>
      {segments.length === 1 ? segments[0] : withProgramDetailTdDivider(segments)}
    </ProgramDetailTdSegmentWrap>
  )
}

export function LectureFeeBasisEditField({
  draft,
  onDraftChange,
  validationError,
}: {
  draft: ApplicantInstructorEditDraft
  onDraftChange: (partial: Partial<ApplicantInstructorEditDraft>) => void
  validationError?: string
}) {
  const showAmountFields =
    draft.lectureFeeBasisType === 'special_lecture' ||
    draft.lectureFeeBasisType === 'other_labor'

  return (
    <div className="applicant-general-instructor-basic-info__lecture-fee-edit">
      <CmsRadioGroup
        className="applicant-general-instructor-basic-info__lecture-fee-radios"
        value={draft.lectureFeeBasisType}
        onChange={e =>
          onDraftChange({
            lectureFeeBasisType: e.target.value as ApplicantInstructorLectureFeeBasisType,
          })
        }
      >
        {LECTURE_FEE_BASIS_TYPE_OPTIONS.map(option => (
          <CmsRadio key={option.value} value={option.value}>
            {option.label}
          </CmsRadio>
        ))}
      </CmsRadioGroup>
      {showAmountFields ? (
        <div className="applicant-general-instructor-basic-info__lecture-fee-amount-row">
          <CmsSelect
            className="applicant-general-instructor-basic-info__lecture-fee-measure"
            inputSize="medium"
            withAllOption={false}
            value={draft.lectureFeeMeasure || undefined}
            options={LECTURE_FEE_MEASURE_OPTIONS}
            onChange={v => onDraftChange({ lectureFeeMeasure: v != null ? String(v) : '' })}
            getPopupContainer={() => document.body}
          />
          <CmsInput
            className="applicant-general-instructor-basic-info__lecture-fee-amount"
            inputSize="medium"
            value={formatLectureFeeAmountInput(draft.lectureFeeAmount)}
            onChange={e =>
              onDraftChange({
                lectureFeeAmount: parseLectureFeeAmountDigits(e.target.value),
              })
            }
            inputMode="numeric"
            suffix="원"
          />
        </div>
      ) : null}
      <FieldError message={validationError} />
    </div>
  )
}

export function InstructorFeeGradeView({ instructor }: { instructor: ApplicantInstructorRow }) {
  return <span>{instructor.instructorFeeGradeLabel?.trim() || '-'}</span>
}

export function InstructorFeeGradeEditField({
  draft,
  onDraftChange,
  validationError,
}: {
  draft: ApplicantInstructorEditDraft
  onDraftChange: (partial: Partial<ApplicantInstructorEditDraft>) => void
  validationError?: string
}) {
  return (
    <div className="applicant-general-instructor-basic-info__field-stack">
      <CmsSelect
        className="applicant-general-instructor-basic-info__full-width-control"
        inputSize="medium"
        withAllOption={false}
        placeholder="선택"
        value={draft.instructorFeeGrade || undefined}
        options={INSTRUCTOR_FEE_GRADE_OPTIONS}
        onChange={v => onDraftChange({ instructorFeeGrade: v != null ? String(v) : '' })}
        getPopupContainer={() => document.body}
      />
      <FieldError message={validationError} />
    </div>
  )
}

export function BusinessIncomeView({ instructor }: { instructor: ApplicantInstructorRow }) {
  return <span>{instructor.businessIncomeEarnerStatus?.trim() || '-'}</span>
}

export function BusinessIncomeEditField({
  draft,
  onDraftChange,
}: {
  draft: ApplicantInstructorEditDraft
  onDraftChange: (partial: Partial<ApplicantInstructorEditDraft>) => void
}) {
  return (
    <CmsRadioGroup
      className="applicant-general-instructor-basic-info__business-income-radios"
      value={draft.businessIncomeEarnerStatus}
      onChange={e =>
        onDraftChange({
          businessIncomeEarnerStatus: e.target.value as ApplicantInstructorBusinessIncomeStatus,
        })
      }
    >
      <CmsRadio value="해당">해당</CmsRadio>
      <CmsRadio value="해당 없음">해당 없음</CmsRadio>
    </CmsRadioGroup>
  )
}
