/** 한국 전화번호 (010-1234-5678, 01012345678, 02-123-4567 등) */
export const KOREAN_PHONE_REGEX = /^(\d{2,3})-?(\d{3,4})-?(\d{4})$/

export function isValidKoreanPhone(value: string): boolean {
  return KOREAN_PHONE_REGEX.test(value.trim())
}
