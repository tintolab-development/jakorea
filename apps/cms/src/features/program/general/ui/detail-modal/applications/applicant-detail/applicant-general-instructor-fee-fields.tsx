import { formatBusinessIncomeDisplay } from '@jakorea/domain/instructor/business-income'
import { INSTRUCTOR_FEE_GRADE_OPTIONS } from '@/features/program/shared/model/program-wage-info'
import { CmsNumericInput } from '@/shared/ui/numeric-input'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { CmsSelect } from '@/shared/ui/cms-select'
import {
  withProgramDetailTdDivider,
  ProgramDetailTdSegmentWrap,
} from '@/features/program/shared/ui/program-detail-td-divider'
import type { ApplicantInstructorEditDraft } from '@/features/program/general/lib/applicant-instructor-detail-edit'
import {
  LECTURE_FEE_BASIS_TYPE_OPTIONS,
  LECTURE_FEE_MEASURE_NOT_APPLICABLE,
  LECTURE_FEE_MEASURE_NOT_APPLICABLE_OPTION,
  LECTURE_FEE_MEASURE_OPTIONS,
  DEFAULT_LECTURE_FEE_MEASURE,
  buildLectureFeeBasisViewSegments,
  type ApplicantInstructorBusinessIncomeStatus,
  type ApplicantInstructorLectureFeeBasisType,
} from '@/features/program/general/lib/applicant-instructor-lecture-fee-basis'
import type { ApplicantInstructorRow } from '@/features/program/shared/model/applicant-instructor'

function FieldError({ message }: { message?: string }) {
  if (!message?.trim()) return null
  return <span className="applicant-general-instructor-basic-info__field-error">{message}</span>
}

export function LectureFeeBasisView({ instructor }: { instructor: ApplicantInstructorRow }) {
  const segments = buildLectureFeeBasisViewSegments(instructor)
  if (segments.length === 0) return <span>-</span>
  if (segments.length === 1) return <span>{segments[0]}</span>

  return (
    <ProgramDetailTdSegmentWrap>{withProgramDetailTdDivider(segments)}</ProgramDetailTdSegmentWrap>
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
  const isProgramBasis = draft.lectureFeeBasisType === 'program'

  const handleBasisTypeChange = (next: ApplicantInstructorLectureFeeBasisType) => {
    if (next === draft.lectureFeeBasisType) return

    if (next === 'program') {
      onDraftChange({
        lectureFeeBasisType: next,
        lectureFeeMeasure: LECTURE_FEE_MEASURE_NOT_APPLICABLE,
      })
      return
    }

    onDraftChange({
      lectureFeeBasisType: next,
      lectureFeeMeasure:
        draft.lectureFeeMeasure === LECTURE_FEE_MEASURE_NOT_APPLICABLE
          ? DEFAULT_LECTURE_FEE_MEASURE
          : draft.lectureFeeMeasure,
    })
  }

  return (
    <div className="applicant-general-instructor-basic-info__lecture-fee-edit">
      <CmsRadioGroup
        size="medium"
        className="applicant-general-instructor-basic-info__lecture-fee-radios"
        value={draft.lectureFeeBasisType}
        onChange={e =>
          handleBasisTypeChange(e.target.value as ApplicantInstructorLectureFeeBasisType)
        }
      >
        {LECTURE_FEE_BASIS_TYPE_OPTIONS.map(option => (
          <CmsRadio size="medium" key={option.value} value={option.value}>
            {option.label}
          </CmsRadio>
        ))}
      </CmsRadioGroup>
      <div className="applicant-general-instructor-basic-info__lecture-fee-amount-row">
        <CmsSelect
          className="applicant-general-instructor-basic-info__lecture-fee-measure"
          inputSize="small"
          width={150}
          withAllOption={false}
          disabled={isProgramBasis}
          value={
            isProgramBasis
              ? LECTURE_FEE_MEASURE_NOT_APPLICABLE
              : draft.lectureFeeMeasure || undefined
          }
          options={
            isProgramBasis
              ? [LECTURE_FEE_MEASURE_NOT_APPLICABLE_OPTION]
              : LECTURE_FEE_MEASURE_OPTIONS
          }
          onChange={v => onDraftChange({ lectureFeeMeasure: v != null ? String(v) : '' })}
          getPopupContainer={() => document.body}
        />
        <div>
          <CmsNumericInput
            mode="currency"
            width={120}
            disabled={isProgramBasis}
            inputSize="small"
            value={draft.lectureFeeAmount}
            onValueChange={value =>
              onDraftChange({
                lectureFeeAmount: value,
              })
            }
          />
          <span style={{ marginLeft: 4 }}>원</span>
        </div>
      </div>
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
        inputSize="small"
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
  // 서버 businessIncomeEarnerStatus만 사용. 값 없음이면 placeholder를 만들지 않는다.
  const label = formatBusinessIncomeDisplay(instructor.businessIncomeEarnerStatus)
  return label ? <span>{label}</span> : null
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
      size="medium"
      className="applicant-general-instructor-basic-info__business-income-radios"
      value={draft.businessIncomeEarnerStatus ?? ''}
      onChange={e =>
        onDraftChange({
          businessIncomeEarnerStatus: e.target.value as ApplicantInstructorBusinessIncomeStatus,
        })
      }
    >
      <CmsRadio size="medium" value="해당">
        해당
      </CmsRadio>
      <CmsRadio size="medium" value="해당 없음">
        해당 없음
      </CmsRadio>
    </CmsRadioGroup>
  )
}
