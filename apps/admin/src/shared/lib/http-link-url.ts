/**
 * Homepage Admin 외부 링크 — DB `^https?://` 제약과 동일
 */

const HTTP_URL_PATTERN = /^https?:\/\//i

export const HTTP_LINK_URL_FORMAT_ALERT = {
  title: '연결 링크 형식 오류',
  content: '연결 링크는 http:// 또는 https://로 시작하는 주소를 입력해 주세요.',
} as const

/** 빈 문자열은 미입력으로 간주 (호출 측에서 필수 여부 판단) */
export function isValidHttpLinkUrl(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return false
  return HTTP_URL_PATTERN.test(trimmed)
}
