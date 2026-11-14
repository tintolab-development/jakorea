export type SiteSettingsView = {
  source: 'fallback' | 'remote'
  title: string
  description: string
  ogImageUrl: string | null
  faviconUrl: string | null
}

/** 미호출·실패·첫 응답 전. 문서 헤드는 index.html을 유지한다. */
export const SITE_SETTINGS_FALLBACK: SiteSettingsView = {
  source: 'fallback',
  title: '',
  description: '',
  ogImageUrl: null,
  faviconUrl: null,
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function readHttpUrl(value: unknown): string | null {
  const url = readText(value)
  if (!url || !/^https?:\/\//i.test(url)) return null
  return url
}

/** 로컬 시드 자리표시 아이콘은 index.html의 CMS와 같은 파비콘을 덮지 않는다. */
function readFaviconUrl(value: unknown): string | null {
  const url = readHttpUrl(value)
  if (!url || url.includes('site-favicon-placeholder')) return null
  return url
}

/** 객체가 아니면 null. siteName이 비면 타이틀은 `JA Korea`. */
export function mapPublicSettings(remote: unknown): SiteSettingsView | null {
  const body = unwrapPayload(remote)
  if (!isRecord(body)) return null
  const siteName = readText(body.siteName)
  return {
    source: 'remote',
    title: siteName || 'JA Korea',
    description: readText(body.seoMetaDescription),
    ogImageUrl: readHttpUrl(body.ogImageUrl),
    faviconUrl: readFaviconUrl(body.faviconUrl),
  }
}

function unwrapPayload(payload: unknown): unknown {
  let current = payload
  for (let depth = 0; depth < 3; depth += 1) {
    if (!isRecord(current) || current.success !== true || !('data' in current)) return current
    current = current.data
  }
  return current
}
