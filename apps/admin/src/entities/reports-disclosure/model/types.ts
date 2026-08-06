/**
 * 보고서 및 공시 관리 도메인 타입
 */

export type ReportKind = 'annual' | 'audit'

export type TransparencyReport = {
  id: string
  kind: ReportKind
  title: string
  thumbnailUrl: string
  thumbnailFileName: string
  attachmentFileName: string
  attachmentUrl: string
  /** 표시 전용 — 어드민에서 수정하지 않음 */
  downloadCount: number
  createdAt: string
  updatedAt: string
}

export type ReportListFilter = {
  title?: string
  attachmentName?: string
  createdFrom?: string
  createdTo?: string
}

export type ReportCreateInput = {
  title: string
  thumbnailUrl: string
  thumbnailFileName: string
  attachmentFileName: string
  attachmentUrl: string
}

export type ReportUpdateInput = ReportCreateInput & {
  id: string
}

export type NtsDisclosure = {
  linkUrl: string
  updatedAt: string
}
