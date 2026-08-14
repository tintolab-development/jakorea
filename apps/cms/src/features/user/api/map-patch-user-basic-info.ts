import type { PatchUserBasicInfoInput } from '@/entities/user/api/user-service'
import type { AdminAccountBasicInfoUpdateRequest } from '@/shared/api/generated/members/schemas/adminAccountBasicInfoUpdateRequest'
import type { AdminMemberBasicInfoUpdateRequest } from '@/shared/api/generated/members/schemas/adminMemberBasicInfoUpdateRequest'
import { filterEditableTermsAgreementsForBasicInfoPatch } from '@/features/user/api/member-basic-info-terms-patch'
import { toApiBirthDate, toApiGender } from '@/features/user/api/map-member-gender-birth'
import {
  toApiInstructorCmsProfile,
  toApiInstructorCmsSettlement,
} from '@/features/user/api/map-instructor-cms-profile'

/**
 * 개인 회원 상세 GET·pre-register는 `address`/`addressDetail`, `schoolName`/`enrollmentStatus`가 SSOT.
 * PATCH OpenAPI(`detailAddress`/`affiliation`)만 보내면 저장되지 않고 새로고침 시 이전 값이 남는다.
 */
export type AdminMemberBasicInfoUpdateRequestWithAddress = AdminMemberBasicInfoUpdateRequest & {
  address?: string
  addressDetail?: string
  homeAddress?: string
  homeAddressDetail?: string
  schoolName?: string
  enrollmentStatus?: 'ENROLLED' | 'NOT_ENROLLED'
  grade?: string
}

function applyHomeAddressToPatchBody(
  body: AdminMemberBasicInfoUpdateRequestWithAddress,
  patch: PatchUserBasicInfoInput
) {
  if (
    patch.detailAddress === undefined &&
    !Object.prototype.hasOwnProperty.call(patch, 'detailAddressDetail')
  ) {
    return
  }
  const street = (patch.detailAddress ?? '').trim()
  const detail = (patch.detailAddressDetail ?? '').trim()
  body.detailAddress = street
  body.address = street
  body.addressDetail = detail
  body.homeAddress = street
  body.homeAddressDetail = detail
}

/** 개인 회원 전용 — `schoolEnrollmentStatus`가 있을 때만 extras를 붙인다. */
function applyIndividualAffiliationToPatchBody(
  body: AdminMemberBasicInfoUpdateRequestWithAddress,
  patch: PatchUserBasicInfoInput
) {
  if (patch.schoolEnrollmentStatus === undefined && patch.individualSchoolName === undefined) {
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
