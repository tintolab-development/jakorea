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

  return body
}

export function hasAdminCommentPatch(patch: PatchUserBasicInfoInput): boolean {
  return Object.prototype.hasOwnProperty.call(patch, 'adminComment')
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
