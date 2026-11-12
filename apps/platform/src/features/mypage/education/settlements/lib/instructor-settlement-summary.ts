import { formatBusinessIncomeDisplay } from '@jakorea/domain/instructor/business-income'
import type { PortalProfileResponse } from '@/features/auth/sign-in'
import { mapInstructorFeeGradeLabel } from '../../../instructor-apply/api/response-codes.ts'
import type { EducationSettlementItem } from '../model/types.ts'
import { formatLectureFeeBasisSummary } from './lecture-fee-preview.ts'

const MISSING = '-'

export function displaySettlementSummaryValue(value: string | null | undefined): string {
  const trimmed = value?.trim()
  return trimmed ? trimmed : MISSING
}

export function readInstructorFeeGradeLabel(
  profile: PortalProfileResponse | null | undefined,
): string {
  const fromMetrics = mapInstructorFeeGradeLabel(profile?.listMetrics?.instructorFeeGradeLabel)
  if (fromMetrics) return fromMetrics
  const fromProfile = mapInstructorFeeGradeLabel(
    profile?.instructorProfile?.profile?.defaultFeeGrade,
  )
  return fromProfile || MISSING
}

/**
 * 강의 상세 "강사비 책정 기준" — 배정 기준(회차 lectureFeePreview) (기획 K7).
 * 회차마다 기준이 다르면 첫 회차 기준으로 표시하고 mixed=true를 돌려준다(추측해 합치지 않는다).
 */
export function readAssignmentFeeBasisLabel(items: readonly EducationSettlementItem[]): {
  label: string
  mixed: boolean
} {
  const labels = items
    .map(item => item.lectureFeePreview)
    .filter(preview => preview != null)
    .map(preview => formatLectureFeeBasisSummary(preview))
    .filter(label => label !== MISSING)
  if (labels.length === 0) return { label: MISSING, mixed: false }
  return { label: labels[0]!, mixed: new Set(labels).size > 1 }
}

export function readInstructorBusinessIncomeLabel(
  profile: PortalProfileResponse | null | undefined,
): string {
  const businessIncome = profile?.instructorProfile?.settlement?.businessIncome
  return formatBusinessIncomeDisplay(typeof businessIncome === 'boolean' ? businessIncome : null) ?? MISSING
}
