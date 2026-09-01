/**
 * 국내 전화번호 검증·포맷 — `@jakorea/domain/shared/korean-phone` 재export
 */

export {
  applyKoreanPhoneInputChange,
  formatKoreanPhoneNumber,
  isValidKoreanPhoneNumber,
  normalizeKoreanPhoneDigits,
} from '@jakorea/domain/shared/korean-phone'

import { isValidKoreanPhoneNumber } from '@jakorea/domain/shared/korean-phone'

/** @deprecated 느슨한 3-4-4 정규식 대신 `isValidKoreanPhoneNumber`를 사용하세요. */
export function isValidKoreanPhone(value: string): boolean {
  return isValidKoreanPhoneNumber(value)
}
