import { formatKoreanPhoneNumber } from '@jakorea/domain/shared/korean-phone'

/** 가입 API `phone` — 백엔드는 `010-1234-5678` 하이픈 형식을 요구한다. */
export function toApiSignupPhone(value: string | undefined): string | undefined {
  const formatted = formatKoreanPhoneNumber(value?.trim() ?? '')
  return formatted || undefined
}
