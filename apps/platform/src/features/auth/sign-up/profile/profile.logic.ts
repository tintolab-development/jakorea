export function isProfileStepValid(address: string, addressDetail: string) {
  return address.trim().length > 0 && addressDetail.trim().length > 0
}
