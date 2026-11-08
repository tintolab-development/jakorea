/**
 * 목록 API는 logoUrl만 내려줄 수 있어, UI 표시용 파일명을 보강한다.
 */
export function resolveCorporatePartnerLogoFileName(
  logoFileName: string | undefined,
  logoUrl: string | undefined,
): string {
  const fromMeta = logoFileName?.trim() ?? ''
  if (fromMeta) return fromMeta
  return deriveFileNameFromAssetUrl(logoUrl ?? '')
}

function deriveFileNameFromAssetUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return ''
  try {
    const pathname = new URL(trimmed).pathname
    const last = pathname.split('/').filter(Boolean).pop()
    if (!last) return '로고 이미지'
    const decoded = decodeURIComponent(last.split('?')[0] ?? last)
    return decoded || '로고 이미지'
  } catch {
    const segment = trimmed.split('/').pop()?.split('?')[0] ?? ''
    if (!segment) return '로고 이미지'
    try {
      return decodeURIComponent(segment) || '로고 이미지'
    } catch {
      return segment || '로고 이미지'
    }
  }
}
