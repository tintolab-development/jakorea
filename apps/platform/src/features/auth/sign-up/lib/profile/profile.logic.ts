import { isRequiredAddressIncomplete } from '@jakorea/domain/shared/required-address'

export const SCHOOL_SELECTION_FIELD_MAX_LENGTH = 255

export function isMinorMemberNameValid(name: string) {
  return name.trim().length > 0
}

export function hasValidSchoolReference(options: {
  schoolOrganizationId?: number | null
  schoolNeisCode?: string | null
}) {
  if (options.schoolOrganizationId != null) return true
  const code = options.schoolNeisCode?.trim() ?? ''
  return code.length > 0 && code.length <= SCHOOL_SELECTION_FIELD_MAX_LENGTH
}

export function isProfileStepValid(
  address: string,
  addressDetail: string,
  /** null = 재학 여부 미선택 — 필수 항목이라 다음 단계로 갈 수 없다 */
  schoolStatus: 'enrolled' | 'none' | null,
  schoolName: string,
  grade: string,
  options?: {
    /** remote 가입 시 재학 중이면 기관 ID 필수 */
    requireSchoolOrganizationId?: boolean
    schoolOrganizationId?: number | null
    schoolNeisCode?: string | null
  },
) {
  const hasAddress = !isRequiredAddressIncomplete({
    address,
    addressDetail,
    subject: 'person',
  })

  if (!hasAddress) {
    return false
  }

  if (schoolStatus == null) {
    return false
  }

  if (schoolStatus === 'enrolled') {
    const name = schoolName.trim()
    const hasSchool = name.length > 0 && grade.trim().length > 0
    if (!hasSchool) return false
    if (name.length > SCHOOL_SELECTION_FIELD_MAX_LENGTH) return false
    if (options?.requireSchoolOrganizationId && options.schoolOrganizationId == null) {
      return false
    }
    return hasValidSchoolReference({
      schoolOrganizationId: options?.schoolOrganizationId,
      schoolNeisCode: options?.schoolNeisCode,
    })
  }

  return true
}
