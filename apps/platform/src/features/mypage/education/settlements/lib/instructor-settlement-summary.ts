import type { PortalProfileResponse } from '@/features/auth/sign-in'

const MISSING = '-'

export function displaySettlementSummaryValue(value: string | null | undefined): string {
  const trimmed = value?.trim()
  return trimmed ? trimmed : MISSING
}

export function readInstructorFeeGradeLabel(
  profile: PortalProfileResponse | null | undefined,
): string {
  const fromMetrics = profile?.listMetrics?.instructorFeeGradeLabel?.trim()
  if (fromMetrics) return fromMetrics
  const fromProfile = profile?.instructorProfile?.profile?.defaultFeeGrade?.trim()
  return fromProfile || MISSING
}

export function readInstructorBusinessIncomeLabel(
  profile: PortalProfileResponse | null | undefined,
): string {
  const settlement = profile?.instructorProfile?.settlement
  if (!settlement || typeof settlement.businessIncome !== 'boolean') return MISSING
  return settlement.businessIncome ? '해당' : '해당 없음'
}
