import type { PatchUserBasicInfoInput } from '@/entities/user/api/user-service'
import type { AdminAccountBasicInfoUpdateRequest } from '@/shared/api/generated/members/schemas/adminAccountBasicInfoUpdateRequest'
import type { AdminMemberBasicInfoUpdateRequest } from '@/shared/api/generated/members/schemas/adminMemberBasicInfoUpdateRequest'
import { toApiBirthDate, toApiGender } from '@/features/user/api/map-member-gender-birth'

/** 관리자 코멘트는 POST comments API로 분리 — PATCH body에서 제외 */
export function mapPatchUserBasicInfoToApiRequest(
  patch: PatchUserBasicInfoInput
): AdminMemberBasicInfoUpdateRequest {
  const body: AdminMemberBasicInfoUpdateRequest = {}

  if (patch.name !== undefined) body.name = patch.name
  if (patch.phone !== undefined) body.phone = patch.phone
  if (patch.email !== undefined) body.email = patch.email
  if (patch.detailAddress !== undefined) body.detailAddress = patch.detailAddress
  if (patch.affiliation !== undefined) body.affiliation = patch.affiliation
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

  const extendedBody = body as Omit<AdminMemberBasicInfoUpdateRequest, 'profile' | 'settlement'> & {
    profile?: PatchUserBasicInfoInput['instructorCmsProfile']
    settlement?: PatchUserBasicInfoInput['instructorCmsSettlement']
  }
  if (patch.instructorCmsProfile != null) {
    extendedBody.profile = patch.instructorCmsProfile
  }
  if (patch.instructorCmsSettlement != null) {
    extendedBody.settlement = patch.instructorCmsSettlement
  }

  // CMS proposal DTO → OpenAPI InstructorCmsProfile (wire JSON 동일, affiliatedSchoolUserId 등 형만 상이)
  return extendedBody as AdminMemberBasicInfoUpdateRequest
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
