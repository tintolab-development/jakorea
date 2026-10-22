import { getApiBaseUrl, getHomepageApiBaseUrl } from '@/shared/lib/api-remote-env'

function resolveAgainstOrigin(uploadUrl: string, baseOrigin: string): string {
  const trimmed = uploadUrl.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed

  const resolvedBaseOrigin =
    baseOrigin.trim() ||
    (typeof window !== 'undefined' ? window.location.origin : 'http://localhost')

  try {
    return new URL(trimmed, `${resolvedBaseOrigin.replace(/\/$/, '')}/`).toString()
  } catch {
    throw new Error('Presigned upload URL이 올바르지 않습니다.')
  }
}

/** JABACK 회원 포탈 파일 업로드 URL을 해석합니다. */
export function resolvePortalPresignedUploadUrl(uploadUrl: string): string {
  return resolveAgainstOrigin(uploadUrl, getApiBaseUrl())
}

/** Homepage 공개 첨부 업로드 URL을 해석합니다. */
export function resolveHomepagePresignedUploadUrl(uploadUrl: string): string {
  return resolveAgainstOrigin(uploadUrl, getHomepageApiBaseUrl())
}
