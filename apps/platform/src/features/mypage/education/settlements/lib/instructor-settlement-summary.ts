import { formatBusinessIncomeDisplay } from '@jakorea/domain/instructor/business-income'
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
  const businessIncome = profile?.instructorProfile?.settlement?.businessIncome
  return formatBusinessIncomeDisplay(typeof businessIncome === 'boolean' ? businessIncome : null) ?? MISSING
}
