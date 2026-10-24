import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import { loadAdminFileBlob } from '@/shared/lib/admin-file-upload/attachments'
import { getJAKoreaCMSBackendAPIPerformanceSubset } from '@/shared/api/generated/performance/performance-api'
import type {
  ExportRecordsParams,
  GeneratedFileJobResponse,
  GetPerformanceSummaryParams,
  ListRecordsParams,
  PerformanceRecordFrontendResponse,
  PerformanceStatsFrontendResponse,
} from '@/shared/api/generated/performance/schemas'
import customInstance from '@/shared/api/orval-mutator'
import { axiosClient } from '@/shared/instance/axios-instance'
import { downloadBlob, generateFilename } from '@/shared/utils/file-download'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { resolveAdminRoleCodeFromUser, showAdminAccessDeniedAlert } from '@/shared/lib/admin-role-policy'
import type { AxiosRequestConfig } from 'axios'

const performanceApi = getJAKoreaCMSBackendAPIPerformanceSubset()

type PerformanceRecordPage = {
  content: PerformanceRecordFrontendResponse[]
  totalElements?: number
  totalPages?: number
}

export type PerformanceRecordListResult = {
  records: PerformanceRecordFrontendResponse[]
  totalElements: number
}

const MAX_PERFORMANCE_LIST_PAGES = 1_000

function asFiniteNonNegativeInteger(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : undefined
}

export function parsePerformanceRecordPage(payload: unknown): PerformanceRecordPage {
  if (Array.isArray(payload)) {
    return { content: payload as PerformanceRecordFrontendResponse[] }
  }

  if (payload && typeof payload === 'object') {
    const page = payload as {
      content?: unknown
      totalElements?: unknown
      totalPages?: unknown
    }
    return {
      content: Array.isArray(page.content)
        ? (page.content as PerformanceRecordFrontendResponse[])
        : [],
      totalElements: asFiniteNonNegativeInteger(page.totalElements),
      totalPages: asFiniteNonNegativeInteger(page.totalPages),
    }
  }

  return { content: [] }
}

/**
 * 현재 BE의 raw-array 페이지 응답과 향후 page metadata 응답을 모두 지원한다.
 * 목록 API의 raw array 계약은 바꾸지 않고, 서버 필터 결과 전체를 화면에 제공한다.
 */
export async function fetchAllPerformanceRecordPages(
  fetchPage: (params: ListRecordsParams) => Promise<unknown>,
  params: ListRecordsParams
): Promise<PerformanceRecordListResult> {
  const pageSize = Math.max(1, params.size ?? 20)
  let page = Math.max(0, params.page ?? 0)
  const records: PerformanceRecordFrontendResponse[] = []
  let totalElements: number | undefined
  let totalPages: number | undefined

  for (let pageIndex = 0; pageIndex < MAX_PERFORMANCE_LIST_PAGES; pageIndex += 1) {
    const parsed = parsePerformanceRecordPage(await fetchPage({ ...params, page }))
    records.push(...parsed.content)
    totalElements ??= parsed.totalElements
    totalPages ??= parsed.totalPages

    if (totalPages != null && page + 1 >= totalPages) break
    if (totalElements != null && records.length >= totalElements) break
    if (parsed.content.length < pageSize) break

    page += 1
  }

  return {
    records,
    totalElements: totalElements ?? records.length,
  }
}

export async function fetchPerformanceRecordsRemote(
  params: ListRecordsParams
): Promise<PerformanceRecordListResult> {
  return fetchAllPerformanceRecordPages(
    async pageParams => unwrapApiBody<unknown>(await performanceApi.listRecords(pageParams)),
    params
  )
}

export async function fetchPerformanceSummaryRemote(
  params?: GetPerformanceSummaryParams
): Promise<PerformanceStatsFrontendResponse> {
  const payload = await performanceApi.getPerformanceSummary(params)
  return unwrapApiBody<PerformanceStatsFrontendResponse>(payload) ?? {}
}

function readHeader(headers: unknown, name: string): string | undefined {
  if (!headers || typeof headers !== 'object') return undefined
  const record = headers as Record<string, unknown>
  const direct = record[name] ?? record[name.toLowerCase()] ?? record[name.toUpperCase()]
  return typeof direct === 'string' ? direct : undefined
}

function filenameFromContentDisposition(value: string | undefined, fallback: string): string {
  if (!value) return fallback
  const utf8 = value.match(/filename\*=UTF-8''([^;]+)/i)?.[1]
  if (utf8) {
    try {
      return decodeURIComponent(utf8.replace(/^"|"$/g, ''))
    } catch {
      return utf8.replace(/^"|"$/g, '')
    }
  }
  return value.match(/filename="?([^";]+)"?/i)?.[1]?.trim() || fallback
}

async function readExportDispatchBody(value: unknown): Promise<unknown> {
  if (typeof Blob !== 'undefined' && value instanceof Blob) {
    const text = await value.text()
    if (!text.trim()) return undefined
    try {
      return JSON.parse(text)
    } catch {
      return undefined
    }
  }
  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      return undefined
    }
  }
  return value
}

function readPositiveId(value: unknown): number | undefined {
  const numberValue =
    typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN
  return Number.isSafeInteger(numberValue) && numberValue > 0 ? numberValue : undefined
}

function resolveGeneratedFileJobId(headers: unknown, body: unknown): number | undefined {
  const headerId = readPositiveId(readHeader(headers, 'x-generated-file-job-id'))
  if (headerId) return headerId

  const location = readHeader(headers, 'location')
  const locationId = location?.match(/\/([^/]+)\/?$/)?.[1]
  const parsedLocationId = readPositiveId(locationId)
  if (parsedLocationId) return parsedLocationId

  const unwrapped = unwrapApiBody<unknown>(body)
  if (!unwrapped || typeof unwrapped !== 'object') return undefined
  const record = unwrapped as Record<string, unknown>
  return (
    readPositiveId(record.generatedFileJobId) ??
    readPositiveId(record.jobId) ??
    readPositiveId(record.id)
  )
}

async function fetchGeneratedFileJob(jobId: number): Promise<GeneratedFileJobResponse> {
  return unwrapApiBody<GeneratedFileJobResponse>(
    await customInstance({
      url: `/api/admin/generated-files/jobs/${encodeURIComponent(jobId)}`,
      method: 'GET',
    })
  )
}

const COMPLETED_JOB_STATUSES = new Set(['COMPLETED', 'SUCCEEDED', 'SUCCESS', 'DONE'])
const FAILED_JOB_STATUSES = new Set(['FAILED', 'ERROR', 'CANCELLED', 'CANCELED', 'EXPIRED'])

async function waitForGeneratedFileJob(jobId: number): Promise<GeneratedFileJobResponse> {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const job = await fetchGeneratedFileJob(jobId)
    const status = job.jobStatus?.trim().toUpperCase() ?? ''
    if (COMPLETED_JOB_STATUSES.has(status)) return job
    if (FAILED_JOB_STATUSES.has(status)) {
      throw new Error(job.failureReason?.trim() || '엑셀 파일 생성에 실패했습니다.')
    }
    if (attempt < 29) {
      await new Promise<void>(resolve => window.setTimeout(resolve, 1_000))
    }
  }
  throw new Error('엑셀 파일 생성 시간이 초과되었습니다. 생성 파일 목록에서 다시 확인해 주세요.')
}

function canStartPerformanceExport(): boolean {
  const user = useAuthStore.getState().user
  const roleCode = resolveAdminRoleCodeFromUser(user)
  if (roleCode !== 'MASTER') return false
  const permissionCodes = user?.permissionCodes
  return permissionCodes == null || permissionCodes.includes('PERFORMANCE_EXPORT_WRITE')
}

/** 공식 BE export API를 통해 현재 필터 전체를 XLSX로 생성·다운로드한다. */
export async function exportPerformanceRecordsRemote(
  params: ExportRecordsParams,
  filenamePrefix = '실적데이터'
): Promise<void> {
  if (!canStartPerformanceExport()) {
    showAdminAccessDeniedAlert()
    return
  }

  const fallbackFilename = generateFilename(filenamePrefix, 'xlsx')
  const response = await axiosClient.request<Blob>({
    url: '/api/admin/performance-records/export',
    method: 'GET',
    params: { ...params, exportType: 'EXCEL' },
    responseType: 'blob',
    skipGlobalErrorAlert: true,
  } as AxiosRequestConfig & { skipGlobalErrorAlert: boolean })

  const filename = filenameFromContentDisposition(
    readHeader(response.headers, 'content-disposition'),
    fallbackFilename
  )

  if (response.status === 200) {
    if (!(response.data instanceof Blob) || response.data.size < 1) {
      throw new Error('엑셀 파일을 받지 못했습니다.')
    }
    await downloadBlob(response.data, filename, { skipAccessLog: true })
    return
  }

  if (response.status !== 202) {
    throw new Error(`엑셀 다운로드 요청이 실패했습니다. (HTTP ${response.status})`)
  }

  const body = await readExportDispatchBody(response.data)
  const jobId = resolveGeneratedFileJobId(response.headers, body)
  if (!jobId) throw new Error('엑셀 파일 생성 작업 ID를 받지 못했습니다.')

  const job = await waitForGeneratedFileJob(jobId)
  const fileObjectId = readPositiveId(job.fileObjectId)
  if (!fileObjectId) throw new Error('생성된 엑셀 파일을 찾지 못했습니다.')
  const blob = await loadAdminFileBlob(fileObjectId, { skipGlobalErrorAlert: true })
  await downloadBlob(blob, filename, { skipAccessLog: true })
}
