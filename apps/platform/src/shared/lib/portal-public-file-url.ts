import { applyPortalPublicFileImageOrigin } from './apply-portal-public-file-image-origin.ts'

export function portalPublicFileContentUrl(fileObjectId: number): string {
  return `/api/portal/public/files/${fileObjectId}/content`
}

export function portalPublicFileDownloadUrl(fileObjectId: number): string {
  return `/api/portal/public/files/${fileObjectId}/download`
}

const STORED_FILE_SRC_RE =
  /(?:https?:\/\/[^"'\\\s)]+)?\/api\/(?:admin|portal\/public)\/files\/(\d+)\/(?:content|download)(?:\?[^"'\\\s)]*)?/g

const FILE_OBJECT_REFERENCE_RE = /^file-object:(\d+)$/
const FILE_OBJECT_TOKEN_RE = /file-object:(\d+)/g

export function fileObjectIdFromStoredFileUrl(src: string): number | null {
  const referenceMatch = src.trim().match(FILE_OBJECT_REFERENCE_RE)
  if (referenceMatch) {
    const referenceId = Number(referenceMatch[1])
    return Number.isSafeInteger(referenceId) && referenceId > 0 ? referenceId : null
  }
  const match = src.match(
    /\/api\/(?:admin|portal\/public)\/files\/(\d+)\/(?:content|download)(?:[/?#]|$)/
  )
  if (!match) return null
  const id = Number(match[1])
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

/**
 * 공개 인라인 이미지 주소.
 * `apiOrigin`이 있으면 플랫폼 호스트가 아닌 API 오리진을 붙인다.
 * 로컬 Vite 프록시처럼 오리진이 비어 있으면 상대 경로를 유지한다.
 */
export function portalPublicInlineImageUrl(fileObjectId: number, apiOrigin = ''): string {
  return applyPortalPublicFileImageOrigin(
    `${portalPublicFileContentUrl(fileObjectId)}?inline=1`,
    apiOrigin,
  )
}

export const PORTAL_INLINE_IMAGE_PREVIEW_FAILURE_MESSAGE =
  '[portal-inline-image] 인라인 이미지 미리보기에 실패해 공개 URL로 표시합니다.'

/**
 * CMS 본문의 admin/공개 파일 URL을 공개 content URL(`?inline=1`)로 바꾼다.
 * 이미지 `src`와 같은 본문에 있는 download 링크도 포함한다.
 * 배포 환경에서는 `apiOrigin`으로 절대 URL을 만들어 `<img>`·링크가 플랫폼 호스트로 가지 않게 한다.
 */
export function rewriteAdminFileContentSrcsForPortal(content: string, apiOrigin = ''): string {
  const fromStored = content.replace(STORED_FILE_SRC_RE, (_match, fileObjectId: string) =>
    portalPublicInlineImageUrl(Number(fileObjectId), apiOrigin),
  )
  FILE_OBJECT_TOKEN_RE.lastIndex = 0
  return fromStored.replace(FILE_OBJECT_TOKEN_RE, (_match, fileObjectId: string) =>
    portalPublicInlineImageUrl(Number(fileObjectId), apiOrigin),
  )
}
