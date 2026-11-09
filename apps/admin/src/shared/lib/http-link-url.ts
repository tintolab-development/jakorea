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

/** http(s) 스킴 + 호스트가 있는 전체 주소. `http://`만 있는 값은 실패. */
export function isCompleteHttpLinkUrl(value: string): boolean {
  const trimmed = value.trim()
  if (!HTTP_URL_PATTERN.test(trimmed)) return false
  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false
    const host = parsed.hostname.trim()
    if (!host) return false
    return /[a-z0-9]/i.test(host)
  } catch {
    return false
  }
}
