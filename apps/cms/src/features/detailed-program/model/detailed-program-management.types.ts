/** 필터: 사용 여부 — 라디오 사용 / 미사용 (전체 없음) */
export type DetailedProgramUsageFilter = 'active' | 'inactive'

export type DetailedProgramManagementRow = {
  id: string
  name: string
  /** true: 사용, false: 미사용 */
  active: boolean
  createdBy: string
  createdAt: string
  /** 프로그램·실적 등에서 참조 중이면 삭제 불가 */
  inUse: boolean
  /**
   * 목록·상세 조회 시점 optimistic concurrency 버전.
   * 응답에 없으면 undefined — 1로 채우지 않는다.
   */
  version?: number
}

export type DetailedProgramManagementTableContext = Record<string, never>

export type DetailedProgramManagementPendingFilters = {
  programName: string
  usageStatus: DetailedProgramUsageFilter
}

export type DetailedProgramDraft = {
  name: string
  active: boolean
  /** 편집 진입 시 조회한 원본 version. 수정 중 재조회로 바꾸지 않는다. */
  version?: number
}
