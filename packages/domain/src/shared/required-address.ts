export type AddressSubject = 'person' | 'organization'

function isBlank(value: string | null | undefined): boolean {
  return !value?.trim()
}

/**
 * 주소가 필수인 양식에서 사람/기관별 상세주소 필수 여부.
 * - person: 검색/도로명 주소 + 상세 주소
 * - organization: 검색/도로명 주소만 (상세 선택)
 */
export function isRequiredAddressIncomplete(input: {
  address: string | null | undefined
  addressDetail?: string | null | undefined
  subject: AddressSubject
}): boolean {
  if (isBlank(input.address)) return true
  if (input.subject === 'person' && isBlank(input.addressDetail)) return true
  return false
}
