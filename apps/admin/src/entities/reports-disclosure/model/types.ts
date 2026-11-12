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
  /** Homepage asset ids (remote) */
  thumbnailAssetId?: number
  /** 서버 필수 우회용 「썸네일 없음」 표식 자산 — 화면에는 썸네일 없음으로 보이고, 다시 저장할 때 재사용 */
  placeholderThumbnailAssetId?: number
  attachmentAssetId?: number
  /** 낙관적 잠금 (remote 필수). mock은 0 */
  version: number
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
  thumbnailFile?: File | null
  attachmentFile?: File | null
  /** 썸네일은 선택 항목 — `null`이면 썸네일 없음(수정 시 기존 썸네일 삭제) */
  thumbnailAssetId?: number | null
  attachmentAssetId?: number
}

export type ReportUpdateInput = ReportCreateInput & {
  id: string
}

export type NtsDisclosure = {
  linkUrl: string
  updatedAt: string
  version: number
}
