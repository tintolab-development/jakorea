/** UJAT 교육 지역 관리 — 도메인 타입 */

export type UjatEducationRegion = {
  id: string
  /** 신청·진행 화면 탭 식별자 (시드 8종 + 신규 등록 `custom_*`) */
  regionKey: string
  sortOrder: number
  active: boolean
  name: string
  createdByName: string
  createdAt: string
  /** 프로그램·신청 등에서 사용된 이력 — true면 삭제 불가 */
  hasUsageHistory: boolean
}

export type UjatEducationRegionDraft = {
  active: boolean
  name: string
}

export type UjatEducationRegionFilters = {
  usageStatus: 'active' | 'inactive'
  name: string
}

export type UjatEducationRegionCreateInput = {
  active: boolean
  name: string
  createdByName?: string
}

export type UjatEducationRegionUpdateInput = {
  active?: boolean
  name?: string
  sortOrder?: number
}
