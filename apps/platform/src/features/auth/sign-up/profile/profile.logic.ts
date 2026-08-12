import { isRequiredAddressIncomplete } from '@jakorea/domain/shared/required-address'

export function isProfileStepValid(
  address: string,
  addressDetail: string,
  schoolStatus: 'enrolled' | 'none',
  schoolName: string,
  grade: string,
  options?: {
    /** remote 가입 시 재학 중이면 기관 ID 필수 */
    requireSchoolOrganizationId?: boolean
    schoolOrganizationId?: number | null
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

  if (schoolStatus === 'enrolled') {
    const hasSchool = schoolName.trim().length > 0 && grade.trim().length > 0
    if (!hasSchool) return false
    if (options?.requireSchoolOrganizationId && options.schoolOrganizationId == null) {
      return false
    }
    return true
  }

  return true
}
