/** Same-origin relative path only (`/mypage/...`). */
export function parseSafeInternalPath(value: string | null | undefined): string | null {
  if (value == null) return null
  const path = value.trim()
  if (path === '' || !path.startsWith('/')) return null
  if (path.startsWith('//') || path.includes('://') || path.includes('\\')) return null
  return path
}
