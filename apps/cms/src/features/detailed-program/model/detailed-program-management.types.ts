/** 필터: 사용 여부 — 전체 / 사용 / 미사용 */
export type DetailedProgramUsageFilter = 'ALL' | 'active' | 'inactive'

export type DetailedProgramManagementRow = {
  id: string
  name: string
  /** true: 사용, false: 미사용 */
  active: boolean
  createdBy: string
  createdAt: string
  /** 프로그램·실적 등에서 참조 중이면 삭제 불가 */
  inUse: boolean
}

export type DetailedProgramManagementTableContext = Record<string, never>

export type DetailedProgramManagementPendingFilters = {
  programName: string
  usageStatus: DetailedProgramUsageFilter
}

export type DetailedProgramDraft = {
  name: string
  active: boolean
}
