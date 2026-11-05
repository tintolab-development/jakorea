import type { PortalProfileResponse } from '@/features/auth/sign-in'
import { mapInstructorFeeGradeLabel } from '@/features/mypage/instructor-apply/api/response-codes'

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

export function readInstructorBusinessIncomeLabel(
  profile: PortalProfileResponse | null | undefined,
): string {
  const settlement = profile?.instructorProfile?.settlement
  if (!settlement || typeof settlement.businessIncome !== 'boolean') return MISSING
  return settlement.businessIncome ? '해당' : '해당 없음'
}

/** 지급조서 확인 — 사업소득 여부 + 원천세 안내 */
export function readInstructorBusinessIncomeConfirmLabel(
  profile: PortalProfileResponse | null | undefined,
): string {
  const settlement = profile?.instructorProfile?.settlement
  if (!settlement || typeof settlement.businessIncome !== 'boolean') return MISSING
  return settlement.businessIncome
    ? '해당, 사업소득 3.3% 적용'
    : '해당 없음, 기타소득 8.8% 적용'
}
