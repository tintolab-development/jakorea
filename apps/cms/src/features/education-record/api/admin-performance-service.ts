import {
  fetchPerformanceRecordsRemote,
  fetchPerformanceSummaryRemote,
} from '@/features/education-record/api/performance-api-client'
import {
  getMockEducationRecordRows,
  mapPerformanceRecordToRow,
} from '@/features/education-record/api/adapters/performance-adapters'
import {
  buildSummaryTabViewFromRows,
  mapPerformanceStatsToSummaryTabView,
  type SummaryTabView,
} from '@/features/education-record/api/adapters/performance-summary-adapters'
import { shouldUsePerformanceRecordsRemoteApi } from '@/features/education-record/api/performance-remote-capabilities'
import type { EducationRecordRow } from '@/features/education-record/model/education-record-types'

const DEFAULT_LIST_PAGE = 0
const DEFAULT_LIST_SIZE = 50

export async function getPerformanceRecordList(): Promise<EducationRecordRow[]> {
  if (shouldUsePerformanceRecordsRemoteApi()) {
    const records = await fetchPerformanceRecordsRemote({
      page: DEFAULT_LIST_PAGE,
      size: DEFAULT_LIST_SIZE,
    })
    return records.map(mapPerformanceRecordToRow).filter(row => row.id.length > 0)
  }

  return getMockEducationRecordRows()
}

/** 합계 탭 — remote: GET /api/admin/performance/summary, mock: 목록 행 클라이언트 집계 */
export async function getPerformanceSummaryTabView(): Promise<SummaryTabView> {
  if (shouldUsePerformanceRecordsRemoteApi()) {
    const dto = await fetchPerformanceSummaryRemote()
    return mapPerformanceStatsToSummaryTabView(dto)
  }
  return buildSummaryTabViewFromRows(getMockEducationRecordRows())
}
