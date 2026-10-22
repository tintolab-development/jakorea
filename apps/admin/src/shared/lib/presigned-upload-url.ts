import { getHomepageApiBaseUrl } from '@/shared/lib/api-remote-env'

/**
 * Homepage asset APIs may return either an absolute S3 URL or a relative
 * signed-storage URL. Resolve the latter against the configured homepage API
 * origin, falling back to the current origin for Vite proxy requests.
 */
export function resolvePresignedUploadUrl(uploadUrl: string): string {
  const trimmed = uploadUrl.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed

  const baseOrigin =
    getHomepageApiBaseUrl() ||
    (typeof window !== 'undefined' ? window.location.origin : 'http://localhost')

  try {
    return new URL(trimmed, `${baseOrigin.replace(/\/$/, '')}/`).toString()
  } catch {
    throw new Error('Presigned upload URL이 올바르지 않습니다.')
  }
}
