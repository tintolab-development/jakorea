import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { formatGeneralProgramCurriculumAssignmentView } from '@/features/program/general/lib/curriculum-display'

/** 복수 회차 — 과제 설정 조회 표시 (responseEntry·등록 폼 미리보기 공통) */
export function CurriculumAssignmentSettingView({
  assignmentEnabled,
  assignmentPeriod,
}: {
  assignmentEnabled?: boolean
  assignmentPeriod?: string
}) {
  const { status, period } = formatGeneralProgramCurriculumAssignmentView(
    assignmentEnabled,
    assignmentPeriod
  )

  if (!period) return <>{status}</>

  return (
    <>
      {status}
      <DetailInfoForm.InputsSeparator />
      {period}
    </>
  )
}
