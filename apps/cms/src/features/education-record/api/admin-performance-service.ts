import { matchesEducationRecordFilter } from '@/features/education-record/lib/match-education-record-filter'
import {
  getMockEducationRecordRows,
  mapPerformanceRecordToRow,
} from '@/features/education-record/api/adapters/performance-adapters'
import {
  buildSummaryTabViewFromRows,
  mapPerformanceStatsToSummaryTabView,
  type SummaryTabView,
} from '@/features/education-record/api/adapters/performance-summary-adapters'
import {
  fetchPerformanceRecordsRemote,
  fetchPerformanceSummaryRemote,
} from '@/features/education-record/api/performance-api-client'
import {
  educationRecordFiltersFromSearchParams,
  performanceListParamsFromSearchParams,
  performanceRecordsParamsFromSearchParams,
} from '@/features/education-record/api/performance-filter-params'
import { shouldUsePerformanceRecordsRemoteApi } from '@/features/education-record/api/performance-remote-capabilities'
import type { EducationRecordRow } from '@/features/education-record/model/education-record-types'

export async function getPerformanceRecordList(
  searchParams: URLSearchParams = new URLSearchParams()
): Promise<EducationRecordRow[]> {
  const filters = educationRecordFiltersFromSearchParams(searchParams)
  if (shouldUsePerformanceRecordsRemoteApi()) {
    const records = await fetchPerformanceRecordsRemote(
      performanceListParamsFromSearchParams(searchParams)
    )
    return records.map(mapPerformanceRecordToRow).filter(row => row.id.length > 0)
  }

  return getMockEducationRecordRows().filter(row => matchesEducationRecordFilter(row, filters))
}

/** 합계 탭 — remote: GET /api/admin/performance/summary, mock: 목록 행 클라이언트 집계. 목록과 동일 솔팅. */
export async function getPerformanceSummaryTabView(
  searchParams: URLSearchParams = new URLSearchParams()
): Promise<SummaryTabView> {
  const filters = educationRecordFiltersFromSearchParams(searchParams)
  if (shouldUsePerformanceRecordsRemoteApi()) {
    const dto = await fetchPerformanceSummaryRemote(
      performanceRecordsParamsFromSearchParams(searchParams)
    )
    return mapPerformanceStatsToSummaryTabView(dto)
  }
  return buildSummaryTabViewFromRows(
    getMockEducationRecordRows().filter(row => matchesEducationRecordFilter(row, filters))
  )
}
