import type { ApplicantInstructorRow } from '@/features/program/shared/model/applicant-instructor'
import type { InstructorApplicationDetailResponse } from '@/shared/api/generated/dashboard/schemas/instructorApplicationDetailResponse'
import type { InstructorCmsProfile } from '@/shared/api/generated/dashboard/schemas/instructorCmsProfile'
import type { InstructorCmsSettlement } from '@/shared/api/generated/members/schemas/instructorCmsSettlement'
import { normalizeInstructorCmsSettlementFromApi } from '@/features/user/api/map-instructor-cms-profile'
import type { User } from '@/types/user'

type InstructorApplicationDetailLoose = InstructorApplicationDetailResponse & {
  settlement?: InstructorCmsSettlement | null
  bankName?: string | null
  accountNumber?: string | null
  accountHolder?: string | null
}

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

function businessIncomeLabelFromSettlement(
  settlement: ReturnType<typeof normalizeInstructorCmsSettlementFromApi>
): string | undefined {
  if (!settlement) return undefined
  return settlement.businessIncome ? '해당' : '해당 없음'
}

/** OpenAPI에 없는 `settlement`·flat 계좌 필드(런타임)까지 읽는다. */
export function readInstructorApplicationSettlementFields(
  dto: InstructorApplicationDetailResponse
): {
  bankName?: string
  accountNumber?: string
  accountHolder?: string
  businessIncomeEarnerStatus?: string
} {
  const loose = dto as InstructorApplicationDetailLoose
  const settlement = normalizeInstructorCmsSettlementFromApi(loose.settlement ?? undefined)
  const bankName = pickTrimmed(settlement?.bankName) ?? pickTrimmed(loose.bankName)
  const accountNumber = pickTrimmed(settlement?.accountNumber) ?? pickTrimmed(loose.accountNumber)
  const accountHolder = pickTrimmed(settlement?.accountHolder) ?? pickTrimmed(loose.accountHolder)
  const businessIncomeEarnerStatus =
    pickTrimmed(dto.businessIncomeEarnerStatus) ?? businessIncomeLabelFromSettlement(settlement)
  return {
    ...(bankName ? { bankName } : {}),
    ...(accountNumber ? { accountNumber } : {}),
    ...(accountHolder ? { accountHolder } : {}),
    ...(businessIncomeEarnerStatus ? { businessIncomeEarnerStatus } : {}),
  }
}

/** 신청 DTO에서 소속·정산·사업소득자 보강 (기존 row 값이 있으면 유지) */
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
    bankName: pickTrimmed(row.bankName) ?? settlementFields.bankName,
    accountNumber: pickTrimmed(row.accountNumber) ?? settlementFields.accountNumber,
    accountHolder: pickTrimmed(row.accountHolder) ?? settlementFields.accountHolder,
    businessIncomeEarnerStatus:
      pickTrimmed(row.businessIncomeEarnerStatus) ?? settlementFields.businessIncomeEarnerStatus,
  }
}

/** 강사 회원 상세 — 신청 상세에 비어 있는 기본정보만 채운다 (신청 스냅샷 우선). */
export function supplementApplicantInstructorBasicInfoFromMember(
  row: ApplicantInstructorRow,
  user: Omit<User, 'password'>
): ApplicantInstructorRow {
  const info = user.instructorInfo
  const businessFromMember =
    info?.isBusinessIncome === true
      ? '해당'
      : info?.isBusinessIncome === false
        ? '해당 없음'
        : undefined

  return {
    ...row,
    affiliation: pickTrimmed(row.affiliation) ?? pickTrimmed(user.affiliation),
    bankName: pickTrimmed(row.bankName) ?? pickTrimmed(info?.bankName),
    accountNumber: pickTrimmed(row.accountNumber) ?? pickTrimmed(info?.accountNumber),
    accountHolder: pickTrimmed(row.accountHolder) ?? pickTrimmed(info?.accountHolder),
    businessIncomeEarnerStatus:
      pickTrimmed(row.businessIncomeEarnerStatus) ?? businessFromMember,
  }
}

export function instructorApplicationRowNeedsMemberBasicInfoSupplement(
  row: ApplicantInstructorRow
): boolean {
  return (
    !pickTrimmed(row.affiliation) ||
    !pickTrimmed(row.bankName) ||
    !pickTrimmed(row.businessIncomeEarnerStatus)
  )
}
