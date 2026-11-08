/**
 * 파일 다운로드 이력
 */

export type FileDownloadLog = {
  id: string
  fileName: string
  userName: string
  downloadedAt: string
  ip: string
  downloadKind: string
  containedPiiLabel: string
}

export type FileDownloadListFilter = {
  fileName?: string
  userName?: string
  from?: string | null
  to?: string | null
  /** 0-based. omit/0 = 첫 페이지 */
  page?: number
}

export type FileDownloadListResult = {
  rows: FileDownloadLog[]
  total: number
}
