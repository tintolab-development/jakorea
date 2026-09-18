import { CmsSelect } from '@/shared/ui'
import { INSTRUCTOR_FEE_GRADE_OPTIONS } from '@/features/program/shared/model/program-wage-info'
import { normalizeInstructorFeeGradeSelectValue } from '@/features/user/api/map-instructor-activity-display'
import type { BasicInfoSectionContext } from './types'

/** 강사·교사겸강사 — 강사비 등급 인라인 편집 (fee-only scope 또는 미본인인증 전체 profile) */
export function canEditInstructorFeeJaFields(ctx: BasicInfoSectionContext): boolean {
  return Boolean(
    ctx.memberInfoEditing &&
      ctx.memberInfoDraft &&
      ctx.onMemberInfoDraftChange &&
      (ctx.feeJaRestrictedEdit || ctx.cmsMayEditBasicProfileFields)
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
