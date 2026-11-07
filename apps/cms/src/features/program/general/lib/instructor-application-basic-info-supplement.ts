import type { ApplicantInstructorRow } from '@/features/program/shared/model/applicant-instructor'
import type { InstructorApplicationDetailResponse } from '@/shared/api/generated/dashboard/schemas/instructorApplicationDetailResponse'
import type { InstructorCmsProfile } from '@/shared/api/generated/dashboard/schemas/instructorCmsProfile'
import {
  parseBusinessIncomeStatus,
  type ApplicantInstructorBusinessIncomeStatus,
} from '@/features/program/general/lib/applicant-instructor-lecture-fee-basis'

function pickTrimmed(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

/** 신청 상세 `instructorCmsProfile.affiliation` → 소속 표시 문자열 */
export function affiliationDisplayFromInstructorCmsProfile(
  profile: InstructorCmsProfile | null | undefined
): string | undefined {
  const affiliation = profile?.affiliation
  if (!affiliation) return undefined
  const school = pickTrimmed(affiliation.schoolName)
  const orgs =
    affiliation.organizationNames?.map(name => name.trim()).filter(Boolean).join(', ') ?? ''
  if (school && orgs) return `${school}, ${orgs}`
  if (school) return school
  return orgs || undefined
}

export type InstructorApplicationSettlementFields = {
  bankName?: string
  accountNumber?: string
  accountHolder?: string
  /** `settlement.businessIncome` 원값. 표시용 사업소득자 여부는 `businessIncomeEarnerStatus`만 사용 */
  settlementBusinessIncome?: boolean
  businessIncomeEarnerStatus?: ApplicantInstructorBusinessIncomeStatus
}

/**
 * 강사 신청 상세 GET 정본에서 정산 정보를 읽는다.
 * - `settlement` null·생략·내부 필드 null/생략/빈 문자열 → 값 없음(키 미생성)
 * - 계좌번호·예금주는 서버 마스킹 수준 그대로 (FE 재마스킹·추정 금지)
 * - 사업소득자 여부는 서버가 결정한 `businessIncomeEarnerStatus`만 사용 (settlement.businessIncome로 계산 금지)
 */
export function readInstructorApplicationSettlementFields(
  dto: InstructorApplicationDetailResponse
): InstructorApplicationSettlementFields {
  const settlement = dto.settlement ?? undefined
  const bankName = pickTrimmed(settlement?.bankName)
  const accountNumber = pickTrimmed(settlement?.accountNumber)
  const accountHolder = pickTrimmed(settlement?.accountHolder)
  const settlementBusinessIncome =
    typeof settlement?.businessIncome === 'boolean' ? settlement.businessIncome : undefined
  const businessIncomeEarnerStatus = parseBusinessIncomeStatus(dto.businessIncomeEarnerStatus)
  return {
    ...(bankName ? { bankName } : {}),
    ...(accountNumber ? { accountNumber } : {}),
    ...(accountHolder ? { accountHolder } : {}),
    ...(settlementBusinessIncome != null ? { settlementBusinessIncome } : {}),
    ...(businessIncomeEarnerStatus ? { businessIncomeEarnerStatus } : {}),
  }
}

/** 신청 DTO에서 소속·정산·사업소득자 보강. 정산·사업소득자는 GET 정본만 사용 (row 폴백 없음) */
export function supplementApplicantInstructorBasicInfoFromApplicationDetail(
  dto: InstructorApplicationDetailResponse,
  row: ApplicantInstructorRow
): Pick<
  ApplicantInstructorRow,
  | 'affiliation'
  | 'affiliationOrganizationId'
  | 'bankName'
  | 'accountNumber'
  | 'accountHolder'
  | 'settlementBusinessIncome'
  | 'businessIncomeEarnerStatus'
> {
  const affiliationFromDto = pickTrimmed(dto.affiliation)
  const affiliationFromProfile = affiliationDisplayFromInstructorCmsProfile(dto.instructorCmsProfile)
  const affiliation = affiliationFromDto ?? affiliationFromProfile ?? pickTrimmed(row.affiliation)

  const settlementFields = readInstructorApplicationSettlementFields(dto)

  return {
    affiliation,
    affiliationOrganizationId:
      dto.affiliationOrganizationId !== undefined
        ? dto.affiliationOrganizationId
        : row.affiliationOrganizationId,
    bankName: settlementFields.bankName,
    accountNumber: settlementFields.accountNumber,
    accountHolder: settlementFields.accountHolder,
    settlementBusinessIncome: settlementFields.settlementBusinessIncome,
    businessIncomeEarnerStatus: settlementFields.businessIncomeEarnerStatus,
  }
}

function isServerMasked(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.includes('*')
}

/**
 * 원문 조회 응답이 프로그램 권한 projection으로 계좌 필드가 제거된 경우,
 * 직전 일반 GET의 서버 마스킹 값을 유지한다 (원문 미노출 + 마스킹 데이터 유지).
 * 마스킹되지 않은 이전 값은 가져오지 않는다.
 */
export function retainMaskedInstructorApplicationSettlement(
  projected: InstructorApplicationDetailResponse,
  previous: InstructorApplicationDetailResponse | undefined
): InstructorApplicationDetailResponse {
  const prev = previous?.settlement
  const next = projected.settlement
  if (!prev || !next) return projected
  const restored = {
    ...(next.accountNumber == null && isServerMasked(prev.accountNumber)
      ? { accountNumber: prev.accountNumber }
      : {}),
    ...(next.accountHolder == null && isServerMasked(prev.accountHolder)
      ? { accountHolder: prev.accountHolder }
      : {}),
  }
  if (Object.keys(restored).length === 0) return projected
  return { ...projected, settlement: { ...next, ...restored } }
}
