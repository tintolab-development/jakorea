import { CmsSelect } from '@/shared/ui'
import { INSTRUCTOR_FEE_GRADE_OPTIONS } from '@/data/mock/program-wage-info'
import { normalizeInstructorFeeGradeSelectValue } from '@/features/user/api/map-instructor-activity-display'
import type { BasicInfoSectionContext } from './types'

/** 본인인증 완료 후 강사·교사 제한 수정 — 강사비·JA 인라인 편집 가능 여부 */
export function canEditInstructorFeeJaFields(ctx: BasicInfoSectionContext): boolean {
  return Boolean(
    ctx.feeJaRestrictedEdit &&
      ctx.memberInfoEditing &&
      ctx.memberInfoDraft &&
      ctx.onMemberInfoDraftChange
  )
}

export function InstructorFeeGradeSelect({
  ctx,
}: {
  ctx: BasicInfoSectionContext
}) {
  const draft = ctx.memberInfoDraft
  const onChange = ctx.onMemberInfoDraftChange
  if (!draft || !onChange) return null
  return (
    <CmsSelect
      value={normalizeInstructorFeeGradeSelectValue(draft.instructorFeeGrade) || undefined}
      onChange={v => {
        const next = v != null ? String(v) : ''
        onChange({
          instructorFeeGrade: next,
          ...(draft.instructorCmsProfile
            ? {
                instructorCmsProfile: {
                  ...draft.instructorCmsProfile,
                  defaultFeeGrade: next,
                },
              }
            : {}),
        })
      }}
      options={INSTRUCTOR_FEE_GRADE_OPTIONS}
      placeholder="선택"
      inputSize="medium"
      width={240}
    />
  )
}
