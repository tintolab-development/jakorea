export function portalPublicFileContentUrl(fileObjectId: number): string {
  return `/api/portal/public/files/${fileObjectId}/content`
}

export function portalPublicFileDownloadUrl(fileObjectId: number): string {
  return `/api/portal/public/files/${fileObjectId}/download`
}

const STORED_FILE_SRC_RE =
  /(?:https?:\/\/[^"'\\\s)]+)?\/api\/(?:admin|portal\/public)\/files\/(\d+)\/(?:content|download)(?:\?[^"'\\\s)]*)?/g

export function fileObjectIdFromStoredFileUrl(src: string): number | null {
  const match = src.match(
    /\/api\/(?:admin|portal\/public)\/files\/(\d+)\/(?:content|download)(?:[/?#]|$)/
  )
  if (!match) return null
  const id = Number(match[1])
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

/** CMS 본문 이미지 src를 공개 content URL로 바꾼다. 미리보기는 `inline=1`. */
export function rewriteAdminFileContentSrcsForPortal(content: string): string {
  return content.replace(STORED_FILE_SRC_RE, (_match, fileObjectId: string) =>
    `${portalPublicFileContentUrl(Number(fileObjectId))}?inline=1`
  )
}
