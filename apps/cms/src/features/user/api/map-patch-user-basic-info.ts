import type { PatchUserBasicInfoInput } from '@/entities/user/api/user-service'
import type { AdminAccountBasicInfoUpdateRequest } from '@/shared/api/generated/members/schemas/adminAccountBasicInfoUpdateRequest'
import type { AdminMemberBasicInfoUpdateRequest } from '@/shared/api/generated/members/schemas/adminMemberBasicInfoUpdateRequest'
import type { PortalSchoolSelectionRequest } from '@/shared/api/generated/members/schemas/portalSchoolSelectionRequest'
import { filterEditableTermsAgreementsForBasicInfoPatch } from '@/features/user/api/member-basic-info-terms-patch'
import { toApiBirthDate, toApiGender } from '@/features/user/api/map-member-gender-birth'
import { resolveNeisEducationOfficeCode } from '@/features/user/api/neis-education-office-code'
import {
  toApiInstructorCmsProfile,
  toApiInstructorCmsSettlement,
} from '@/features/user/api/map-instructor-cms-profile'

/**
 * 개인 회원 상세 GET·pre-register는 `address`/`addressDetail`, `schoolName`/`enrollmentStatus`가 SSOT.
 * PATCH OpenAPI(`detailAddress`/`affiliation`)만 보내면 저장되지 않고 새로고침 시 이전 값이 남는다.
 */
export type AdminMemberBasicInfoUpdateRequestWithAddress = Omit<
  AdminMemberBasicInfoUpdateRequest,
  'schoolOrganizationId' | 'enrollmentStatus' | 'schoolName' | 'grade' | 'schoolSelection'
> & {
  address?: string
  addressDetail?: string
  homeAddress?: string
  homeAddressDetail?: string
  schoolName?: string
  enrollmentStatus?: 'ENROLLED' | 'NOT_ENROLLED'
  grade?: string
  /** BE wire extension — 소속 해제 시 `null` (omit 금지). OpenAPI는 number만이라 Omit 후 재선언. */
  schoolOrganizationId?: number | null
  schoolSelection?: PortalSchoolSelectionRequest
}

function trimOptional(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function buildIndividualSchoolSelectionFromPatch(
  patch: PatchUserBasicInfoInput
): PortalSchoolSelectionRequest | undefined {
  const name = trimOptional(patch.individualSchoolName)
  if (!name) return undefined

  const provider = trimOptional(patch.individualSchoolProvider)
  const selection: PortalSchoolSelectionRequest = {
    name,
    organizationCategory: 'SCHOOL',
  }
  if (provider) selection.provider = provider
  const externalSchoolCode = trimOptional(patch.individualSchoolExternalCode)
  if (externalSchoolCode) {
    selection.externalSchoolCode = externalSchoolCode
    if (!selection.provider) selection.provider = 'NEIS'
  }
  // schoolSelection은 검색 선택값 — 코드가 없으면 snapshot(schoolName)만 유지
  if (!selection.externalSchoolCode) return undefined

  const educationOfficeCode = resolveNeisEducationOfficeCode({
    provider: selection.provider,
    educationOfficeCode: patch.individualSchoolEducationOfficeCode,
    regionSido: patch.individualSchoolRegionSido,
    externalSchoolCode,
  })
  if (educationOfficeCode) selection.educationOfficeCode = educationOfficeCode
  const schoolLevel = trimOptional(patch.individualSchoolLevel)
  if (schoolLevel) selection.schoolLevel = schoolLevel
  const regionSido = trimOptional(patch.individualSchoolRegionSido)
  if (regionSido) selection.regionSido = regionSido
  const regionSigungu = trimOptional(patch.individualSchoolRegionSigungu)
  if (regionSigungu) selection.regionSigungu = regionSigungu
  const zipcode = trimOptional(patch.individualSchoolZipcode)
  if (zipcode) selection.zipcode = zipcode
  const address = trimOptional(patch.individualSchoolAddress)
  if (address) selection.address = address
  return selection
}

function applyHomeAddressToPatchBody(
  body: AdminMemberBasicInfoUpdateRequestWithAddress,
  patch: PatchUserBasicInfoInput
) {
  if (
    patch.detailAddress === undefined &&
    !Object.prototype.hasOwnProperty.call(patch, 'detailAddressDetail') &&
    patch.zipCode === undefined
  ) {
    return
  }
  if (patch.detailAddress !== undefined || Object.prototype.hasOwnProperty.call(patch, 'detailAddressDetail')) {
    const street = (patch.detailAddress ?? '').trim()
    const detail = (patch.detailAddressDetail ?? '').trim()
    body.detailAddress = street
    body.address = street
    body.addressDetail = detail
    body.homeAddress = street
    body.homeAddressDetail = detail
  }
  if (patch.zipCode !== undefined) {
    body.zipCode = patch.zipCode.trim()
  }
}

/** 개인 회원 전용 — `schoolEnrollmentStatus`가 있을 때만 extras를 붙인다. */
function applyIndividualAffiliationToPatchBody(
  body: AdminMemberBasicInfoUpdateRequestWithAddress,
  patch: PatchUserBasicInfoInput
) {
  if (patch.schoolEnrollmentStatus === undefined && patch.individualSchoolName === undefined) {
    return
  }

  if (patch.schoolEnrollmentStatus === 'NOT_ENROLLED') {
    body.enrollmentStatus = 'NOT_ENROLLED'
    // 미재학 소속명 — OpenAPI schoolName 호환 + affiliation
    const affiliationName = (patch.affiliation ?? '').trim()
    body.schoolName = affiliationName
    body.grade = ''
    body.schoolOrganizationId = null
    return
  }

  if (patch.individualSchoolName !== undefined) {
    body.schoolName = patch.individualSchoolName
  }
  if (patch.schoolEnrollmentStatus !== undefined) {
    body.enrollmentStatus = patch.schoolEnrollmentStatus
  }
  const grade = patch.individualGrade?.trim()
  if (grade) {
    body.grade = grade
  } else if (patch.schoolEnrollmentStatus === 'ENROLLED' && patch.individualGrade === '') {
    body.grade = ''
  }

  if (patch.schoolEnrollmentStatus !== 'ENROLLED') {
    return
  }

  if (Object.prototype.hasOwnProperty.call(patch, 'individualSchoolOrganizationId')) {
    const organizationId = patch.individualSchoolOrganizationId
    if (organizationId != null && Number.isFinite(organizationId)) {
      body.schoolOrganizationId = organizationId
      return
    }
    const schoolSelection = buildIndividualSchoolSelectionFromPatch(patch)
    if (schoolSelection) {
      body.schoolSelection = schoolSelection
    }
    if (organizationId === null) {
      body.schoolOrganizationId = null
    }
  } else {
    const schoolSelection = buildIndividualSchoolSelectionFromPatch(patch)
    if (schoolSelection) body.schoolSelection = schoolSelection
  }
}

/** 관리자 코멘트는 POST comments API로 분리 — PATCH body에서 제외 */
export function mapPatchUserBasicInfoToApiRequest(
  patch: PatchUserBasicInfoInput
): AdminMemberBasicInfoUpdateRequestWithAddress {
  const body: AdminMemberBasicInfoUpdateRequestWithAddress = {}

  if (patch.name !== undefined) body.name = patch.name
  if (patch.phone !== undefined) body.phone = patch.phone
  if (patch.email !== undefined) body.email = patch.email
  applyHomeAddressToPatchBody(body, patch)
  if (patch.affiliation !== undefined) body.affiliation = patch.affiliation
  applyIndividualAffiliationToPatchBody(body, patch)
  if (Object.prototype.hasOwnProperty.call(patch, 'id1365')) {
    const id1365 = patch.id1365?.trim()
    body.external1365Id = id1365 ?? ''
  }
  if (patch.gender !== undefined) {
    body.gender = toApiGender(patch.gender) ?? patch.gender
  }
  if (patch.birthDate !== undefined) {
    if (typeof patch.birthDate === 'string') {
      body.birthDate = toApiBirthDate(patch.birthDate) ?? patch.birthDate
    } else if (patch.birthDate != null) {
      body.birthDate = new Date(patch.birthDate).toISOString().slice(0, 10)
    } else {
      body.birthDate = undefined
    }
  }
  if (patch.socialAccounts !== undefined) body.socialAccounts = patch.socialAccounts
  if (patch.listMetrics != null) {
    body.listMetrics = { ...patch.listMetrics }
  }
  if (patch.schoolInfo != null) {
    body.schoolInfo = {
      ...(patch.schoolInfo.schoolName !== undefined
        ? { schoolName: patch.schoolInfo.schoolName }
        : {}),
      ...(patch.schoolInfo.address !== undefined ? { address: patch.schoolInfo.address } : {}),
      ...(patch.schoolInfo.position !== undefined ? { position: patch.schoolInfo.position } : {}),
    }
  }
  if (patch.instructorInfo != null) {
    body.instructorInfo = {
      ...(patch.instructorInfo.bankName !== undefined
        ? { bankName: patch.instructorInfo.bankName }
        : {}),
      ...(patch.instructorInfo.accountNumber !== undefined
        ? { accountNumber: patch.instructorInfo.accountNumber }
        : {}),
      ...(patch.instructorInfo.accountHolder !== undefined
        ? { accountHolder: patch.instructorInfo.accountHolder }
        : {}),
      ...(patch.instructorInfo.isBusinessIncome !== undefined
        ? { isBusinessIncome: patch.instructorInfo.isBusinessIncome }
        : {}),
    }
  }
  if (patch.instructorCertifications != null) {
    body.instructorInfo = {
      ...(body.instructorInfo ?? {}),
      certifications: patch.instructorCertifications,
    }
  }

  if (patch.instructorCmsProfile != null) {
    body.profile = toApiInstructorCmsProfile(patch.instructorCmsProfile)
  }
  if (patch.instructorCmsSettlement != null) {
    body.settlement = toApiInstructorCmsSettlement(patch.instructorCmsSettlement)
  }
  const editableTerms = filterEditableTermsAgreementsForBasicInfoPatch(patch.termsAgreements)
  if (editableTerms != null && editableTerms.length > 0) {
    body.termsAgreements = editableTerms
  }

  return body
}

export function hasAdminCommentPatch(patch: PatchUserBasicInfoInput): boolean {
  return Object.prototype.hasOwnProperty.call(patch, 'adminComment')
}

/** `adminComment`만 있는 patch — 코멘트 API만 호출하고 상세 GET을 생략할 때 사용 */
export function isAdminCommentOnlyPatch(patch: PatchUserBasicInfoInput): boolean {
  const keys = Object.keys(patch) as (keyof PatchUserBasicInfoInput)[]
  return keys.length === 1 && keys[0] === 'adminComment'
}

/** 관리자 계정 — `PATCH /api/admin/admin-accounts/{adminId}/basic-info` */
export function mapPatchUserBasicInfoToAdminAccountApiRequest(
  patch: PatchUserBasicInfoInput
): AdminAccountBasicInfoUpdateRequest {
  const body: AdminAccountBasicInfoUpdateRequest = {}

  if (patch.name !== undefined) body.name = patch.name
  if (patch.phone !== undefined) body.phone = patch.phone
  if (patch.gender !== undefined) {
    body.gender = toApiGender(patch.gender) ?? patch.gender
  }
  if (patch.birthDate !== undefined) {
    if (typeof patch.birthDate === 'string') {
      body.birthDate = toApiBirthDate(patch.birthDate) ?? patch.birthDate
    } else if (patch.birthDate != null) {
      body.birthDate = new Date(patch.birthDate).toISOString().slice(0, 10)
    }
  }

  if (Object.keys(body).length > 0) {
    body.reason = 'CMS 관리자 회원 정보 수정'
  }

  return body
}
