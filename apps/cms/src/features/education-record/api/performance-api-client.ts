import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import { getJAKoreaCMSBackendAPIPerformanceSubset } from '@/shared/api/generated/performance/performance-api'
import type {
  GetPerformanceSummaryParams,
  ListRecordsParams,
  PerformanceRecordFrontendResponse,
  PerformanceStatsFrontendResponse,
} from '@/shared/api/generated/performance/schemas'

const performanceApi = getJAKoreaCMSBackendAPIPerformanceSubset()

export async function fetchPerformanceRecordsRemote(
  params: ListRecordsParams
): Promise<PerformanceRecordFrontendResponse[]> {
  const payload = await performanceApi.listRecords(params)
  const body = unwrapApiBody<
    PerformanceRecordFrontendResponse[] | { content?: PerformanceRecordFrontendResponse[] }
  >(payload)
  if (Array.isArray(body)) return body
  if (body && typeof body === 'object' && Array.isArray(body.content)) {
    return body.content
  }
  return []
}

export async function fetchPerformanceSummaryRemote(
  params?: GetPerformanceSummaryParams
): Promise<PerformanceStatsFrontendResponse> {
  const payload = await performanceApi.getPerformanceSummary(params)
  return unwrapApiBody<PerformanceStatsFrontendResponse>(payload) ?? {}
}
