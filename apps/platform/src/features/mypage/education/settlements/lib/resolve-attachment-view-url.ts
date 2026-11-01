import { getApiBaseUrl } from '@/shared/lib/api-remote-env'

/** attachments[].viewUrl — 상대경로면 JABACK API origin(또는 Vite 동일 출처 프록시)으로 해석 */
export function resolveSettlementDocumentAttachmentViewUrl(viewUrl: string): string {
  const trimmed = viewUrl.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('blob:') || trimmed.startsWith('data:')) {
    return trimmed
  }
  const base = getApiBaseUrl().trim()
  const origin = base || (typeof window !== 'undefined' ? window.location.origin : '')
  if (!origin) return trimmed
  try {
    return new URL(trimmed, `${origin.replace(/\/$/, '')}/`).toString()
  } catch {
    return trimmed
  }
}
