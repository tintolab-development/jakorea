/**
 * 파일 다운로드 이력
 */

export type FileDownloadLog = {
  id: string
  fileName: string
  userName: string
  downloadedAt: string
  ip: string
}

export type FileDownloadListFilter = {
  fileName?: string
  userName?: string
  from?: string | null
  to?: string | null
}

export type FileDownloadListResult = {
  rows: FileDownloadLog[]
  total: number
}
