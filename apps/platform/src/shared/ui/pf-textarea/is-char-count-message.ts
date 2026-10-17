/** `12/1000` 형태의 글자 수 표시 — 하단 안내 문구와 구분 */
export function isCharCountMessage(message: string | undefined): boolean {
  if (message == null) return false
  return /^\d+\s*\/\s*\d+$/.test(message.trim())
}
