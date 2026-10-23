/**
 * 1사1교 RHF/Canonical → Legacy economyRegistration overlay.
 * Form Version·serviceDetailJson 호환 출력 전용. CREATE 입력 정본이 아니다.
 */
import type { CompanySchoolRegistrationCommonCanonical } from './registration-canonical-types'
import {
  projectCompanySchoolRhfToOverlayRecord,
  rhfValuesFromCompanySchoolCanonical,
} from './registration-rhf-values'
import type { CompanySchoolRegistrationRhfValues } from './registration-rhf-values'

const WAGE_AND_PAYMENT_KEYS = [
  'economyRegistration.wageInfo.grade1Fee',
  'economyRegistration.wageInfo.grade1DistanceFee',
  'economyRegistration.wageInfo.grade2Fee',
  'economyRegistration.wageInfo.grade2DistanceFee',
  'economyRegistration.wageInfo.grade3Fee',
  'economyRegistration.wageInfo.grade3DistanceFee',
  'economyRegistration.wageInfo.paymentItemValues',
] as const

const KPI_KEYS = [
  'economyRegistration.kpi.participantCount',
  'economyRegistration.kpi.instructor',
  'economyRegistration.kpi.dispatchedSchool',
  'economyRegistration.kpi.dispatchedClass',
] as const

export function serializeCompanySchoolRegistrationForFormVersion(
  values: CompanySchoolRegistrationRhfValues
): Record<string, unknown> {
  return projectCompanySchoolRhfToOverlayRecord(values)
}

export function serializeCompanySchoolCompatibilityOverlay(
  common: CompanySchoolRegistrationCommonCanonical,
  sidecar?: Record<string, unknown>
): Record<string, unknown> {
  return projectCompanySchoolRhfToOverlayRecord(
    rhfValuesFromCompanySchoolCanonical(common, sidecar)
  )
}

/** Program 재생성 overlay가 RHF 원숫자·지급항목 ID·KPI 미입력을 덮지 않게 leftover를 유지한다. */
export function preserveCompanySchoolCompatibilityOverlay(
  rebuilt: Record<string, unknown>,
  leftover: Record<string, unknown> | undefined
): Record<string, unknown> {
  if (leftover == null) return rebuilt
  const next = { ...rebuilt }
  for (const key of [...WAGE_AND_PAYMENT_KEYS, ...KPI_KEYS]) {
    if (Object.prototype.hasOwnProperty.call(leftover, key)) {
      next[key] = leftover[key]
    }
  }
  return next
}
