import { getApiBaseUrlForPath } from '@/shared/lib/api-remote-env'
import { applyPortalPublicFileImageOrigin } from './apply-portal-public-file-image-origin'

/**
 * QA/배포: /api/portal/public/files/123/content -> JABACK 절대 URL
 * 로컬 Vite proxy: API base가 비어 있으면 상대 경로 유지
 * 외부 절대 URL / blob: / data: 등: 원본 유지
 */
export function resolvePortalPublicFileImageUrl(
  input?: string | null,
): string | undefined {
  const url = input?.trim()
  if (!url) return undefined
  return applyPortalPublicFileImageOrigin(url, getApiBaseUrlForPath(url))
}
