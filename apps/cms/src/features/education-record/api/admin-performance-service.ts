import { mapPerformanceRecordToRow } from '@/features/education-record/api/adapters/performance-adapters'
import {
  mapPerformanceStatsToSummaryTabView,
  type SummaryTabView,
} from '@/features/education-record/api/adapters/performance-summary-adapters'
import {
  fetchPerformanceRecordsRemote,
  fetchPerformanceSummaryRemote,
  type PerformanceRecordListResult,
} from '@/features/education-record/api/performance-api-client'
import {
  performanceListParamsFromSearchParams,
  performanceRecordsParamsFromSearchParams,
} from '@/features/education-record/api/performance-filter-params'
import {
  isPerformanceRecordsRemoteEnabled,
  shouldUsePerformanceRecordsRemoteApi,
} from '@/features/education-record/api/performance-remote-capabilities'
import { PerformanceRemoteUnavailableError } from '@/features/education-record/api/performance-errors'
import type { EducationRecordRow } from '@/features/education-record/model/education-record-types'

export async function getPerformanceRecordList(
  searchParams: URLSearchParams = new URLSearchParams()
): Promise<PerformanceRecordListResult & { rows: EducationRecordRow[] }> {
  if (shouldUsePerformanceRecordsRemoteApi()) {
    const result = await fetchPerformanceRecordsRemote(
      performanceListParamsFromSearchParams(searchParams)
    )
    return {
      ...result,
      rows: result.records.map(mapPerformanceRecordToRow).filter(row => row.id.length > 0),
    }
  }
  throw new PerformanceRemoteUnavailableError(
    isPerformanceRecordsRemoteEnabled() ? 'AUTH_REQUIRED' : 'API_NOT_CONFIGURED'
  )
}

/** 합계 탭 — 목록과 동일한 URL 필터로 BE 고유 집계를 조회한다. */
export async function getPerformanceSummaryTabView(
  searchParams: URLSearchParams = new URLSearchParams()
): Promise<SummaryTabView> {
  if (shouldUsePerformanceRecordsRemoteApi()) {
    const dto = await fetchPerformanceSummaryRemote(
      performanceRecordsParamsFromSearchParams(searchParams)
    )
    return mapPerformanceStatsToSummaryTabView(dto)
  }
  throw new PerformanceRemoteUnavailableError(
    isPerformanceRecordsRemoteEnabled() ? 'AUTH_REQUIRED' : 'API_NOT_CONFIGURED'
  )
}
