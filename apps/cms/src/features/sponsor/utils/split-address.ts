export interface SplitAddressResult {
  district: string
  detailAddress: string
}

/**
 * Splits a full address string into district (first 3 tokens)
 * and detail address (remaining tokens).
 */
export function splitAddress(address: string): SplitAddressResult {
  const trimmed = address.trim()
  if (!trimmed) {
    return { district: '', detailAddress: '' }
  }
  const chunks = trimmed.split(' ').filter(Boolean)
  if (chunks.length <= 3) {
    return { district: trimmed, detailAddress: '' }
  }
  return {
    district: chunks.slice(0, 3).join(' '),
    detailAddress: chunks.slice(3).join(' '),
  }
}
