export function isProfileStepValid(
  address: string,
  addressDetail: string,
  schoolStatus: 'enrolled' | 'none',
  schoolName: string,
  grade: string,
) {
  const hasAddress = address.trim().length > 0 && addressDetail.trim().length > 0

  if (!hasAddress) {
    return false
  }

  if (schoolStatus === 'enrolled') {
    return schoolName.trim().length > 0 && grade.trim().length > 0
  }

  return true
}
