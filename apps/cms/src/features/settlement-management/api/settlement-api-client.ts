import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import type { BulkDownloadEndpointResponse } from '@/features/user/api/download-bulk-endpoint'
import { getJAKoreaCMSBackendAPISettlementSubset } from '@/shared/api/generated/settlement/settlement-api'
import customInstance from '@/shared/api/orval-mutator'
import type {
  AccountPaymentDetailResponse,
  BudgetSummaryParams,
  ListAccountPaymentsParams,
  ListExportHistoriesParams,
  ListPaymentStatementsParams,
  ListSettlementAggregatesParams,
  ListSettlementsParams,
  PageResponseAccountPaymentListItemResponse,
  PageResponsePaymentStatementListItemResponse,
  PageResponseSettlementExportHistoryResponse,
  PageResponseSettlementListItemResponse,
  PageResponseSettlementTransportationSnapshotResponse,
  SettlementBudgetSummaryResponse,
  SettlementBulkStatusChangeRequest,
  SettlementConfigResponse,
  SettlementCorrectionRequest,
  SettlementDocumentDownloadResponse,
  SettlementExportRequest,
  SettlementExportHistoryResponse,
  SettlementFrontendResponse,
  SettlementStatusChangeRequest,
  SettlementAggregateResponse,
  SettlementConfigUpdateRequest,
} from '@/shared/api/generated/settlement/schemas'

const settlementApi = getJAKoreaCMSBackendAPISettlementSubset()

export async function fetchSettlementsPageRemote(
  params: ListSettlementsParams
): Promise<PageResponseSettlementListItemResponse> {
  return unwrapApiBody(await settlementApi.listSettlements(params))
}

export async function fetchPaymentStatementsPageRemote(
  params: ListPaymentStatementsParams
): Promise<PageResponsePaymentStatementListItemResponse> {
  return unwrapApiBody(await settlementApi.listPaymentStatements(params))
}

export async function fetchSettlementDetailRemote(
  settlementId: number
): Promise<SettlementFrontendResponse> {
  return unwrapApiBody(await settlementApi.getSettlement(settlementId))
}

export async function fetchSettlementTransportationSnapshotsRemote(
  settlementId: number
): Promise<PageResponseSettlementTransportationSnapshotResponse['items']> {
  const page = unwrapApiBody<PageResponseSettlementTransportationSnapshotResponse>(
    await settlementApi.listTransportationSnapshots({ settlementId, page: 0, size: 20 })
  )
  return page.items ?? []
}

export async function confirmPaymentStatementRemote(
  statementId: number,
  body: SettlementStatusChangeRequest = { reason: '지급조서 확인' }
): Promise<void> {
  await settlementApi.confirmPaymentStatement(statementId, body)
}

export async function bulkConfirmPaymentStatementsRemote(
  body: SettlementBulkStatusChangeRequest
): Promise<void> {
  await unwrapApiBody(await settlementApi.bulkConfirmPaymentStatements(body))
}

export async function bulkMarkAccountPaymentsPaidRemote(
  body: SettlementBulkStatusChangeRequest
): Promise<void> {
  await unwrapApiBody(await settlementApi.bulkPaid(body))
}

export async function fetchSettlementBudgetSummaryRemote(
  params: BudgetSummaryParams = {}
): Promise<SettlementBudgetSummaryResponse> {
  return unwrapApiBody(await settlementApi.budgetSummary(params))
}

export async function fetchSettlementAggregatesRemote(
  params: ListSettlementAggregatesParams
): Promise<SettlementAggregateResponse[]> {
  const data = await unwrapApiBody(await settlementApi.listSettlementAggregates(params))
  return Array.isArray(data) ? data : []
}

/** OpenAPI 감사 문구 정본 — 계좌 지급 상세 GET `reason` 쿼리 */
export const ACCOUNT_PAYMENT_DETAIL_AUDIT_REASON = '정산금의 계좌 지급 처리를 위함'

export async function fetchAccountPaymentDetailRemote(
  paymentId: number,
  reason: string = ACCOUNT_PAYMENT_DETAIL_AUDIT_REASON
): Promise<AccountPaymentDetailResponse> {
  return unwrapApiBody(await settlementApi.getAccountPayment(paymentId, { reason }))
}

export async function downloadPaymentStatementRemote(
  settlementId: number
): Promise<SettlementDocumentDownloadResponse> {
  return unwrapApiBody(await settlementApi.downloadPaymentStatement(settlementId))
}

export async function fetchPaymentStatementRenderDataRemote(settlementId: number) {
  return unwrapApiBody(await settlementApi.paymentStatementRenderData(settlementId))
}

/** settlement-api — PATCH .../statements/{statementId}/reject (notificationType OpenAPI 반영) */
export async function rejectPaymentStatementRemote(
  statementId: number,
  body: SettlementStatusChangeRequest
): Promise<void> {
  await settlementApi.rejectPaymentStatement(statementId, body)
}

export async function requestSettlementCorrectionRemote(
  settlementId: number,
  body: SettlementCorrectionRequest
): Promise<void> {
  await settlementApi.requestCorrection(settlementId, body)
}

/** 선택 정산 건 지급조서 ZIP — OpenAPI `POST …/payment-statements/bulk-download/jobs` */
export async function bulkDownloadPaymentStatementsRemote(body: {
  settlementIds: number[]
}): Promise<BulkDownloadEndpointResponse> {
  const job = unwrapApiBody(
    await settlementApi.paymentStatements({ settlementIds: body.settlementIds })
  ) as import('@/shared/api/generated/settlement/schemas/bulkDownloadJobResponse').BulkDownloadJobResponse

  const status = (job.status ?? '').trim().toUpperCase()
  if (status === 'CLIENT_RENDER_REQUIRED') {
    throw new Error('CLIENT_RENDER_REQUIRED')
  }

  const fileObjectId = job.zipJob?.fileObjectId ?? job.fileObjectIds?.[0]
  if (fileObjectId != null) {
    const { getFileDownload } = await import('@/shared/lib/admin-file-upload')
    const resolved = await getFileDownload(fileObjectId)
    const url = resolved.downloadUrl?.trim()
    if (url) return { downloadEndpoint: url }
  }

  // 레거시 hand-wrap path (스펙 외) — 서버가 아직 jobs만 지원하면 404 → 호출부 건별 fallback
  try {
    return unwrapApiBody(
      await customInstance<BulkDownloadEndpointResponse>({
        url: '/api/admin/settlements/payment-statements/bulk-download',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: body,
      })
    )
  } catch {
    throw new Error('지급조서 일괄 다운로드 URL이 없습니다.')
  }
}

export async function resolvePaymentStatementIdForSettlement(
  settlementId: number
): Promise<number | undefined> {
  const items = await fetchAllPaymentStatementsRemote()
  return items.find(item => item.settlementId === settlementId)?.statementId
}

export async function fetchAccountPaymentsPageRemote(
  params: ListAccountPaymentsParams
): Promise<PageResponseAccountPaymentListItemResponse> {
  return unwrapApiBody(await settlementApi.listAccountPayments(params))
}

export async function markAccountPaymentPaidRemote(
  paymentId: number,
  body: SettlementStatusChangeRequest = { reason: '계좌 지급 완료' }
): Promise<void> {
  await settlementApi.markPaid(paymentId, body)
}

export async function markAccountPaymentFailedRemote(
  paymentId: number,
  body: SettlementStatusChangeRequest = { reason: '' }
): Promise<void> {
  await settlementApi.markFailed(paymentId, body)
}

export async function requestBulkTransferExportRemote(
  body: SettlementExportRequest
): Promise<SettlementExportHistoryResponse> {
  return unwrapApiBody<SettlementExportHistoryResponse>(
    await settlementApi.requestBulkTransferExport(body)
  )
}

export async function requestTaxReportExportRemote(
  body: SettlementExportRequest
): Promise<SettlementExportHistoryResponse> {
  return unwrapApiBody<SettlementExportHistoryResponse>(
    await settlementApi.requestTaxReportExport(body)
  )
}

/** sensitive SERVER_FILE 다운로드는 downloadUrl 대신 fileObjectId로 받는다. */
export function isSettlementExportFileReady(
  exportHistory: SettlementExportHistoryResponse | null | undefined
): boolean {
  if (exportHistory == null) return false
  if (exportHistory.pollingStatus === 'FAILED' || exportHistory.exportStatus === 'FAILED') {
    return false
  }
  if (exportHistory.fileObjectId != null && Number.isFinite(exportHistory.fileObjectId)) {
    return true
  }
  return Boolean(exportHistory.downloadUrl?.trim())
}

/**
 * 비동기 Worker export가 준비될 때까지 이력의 동일 export만 재조회한다.
 * SERVER_FILE 민감 다운로드는 fileObjectId 존재를 완료 조건으로 본다.
 */
export async function waitForSettlementExportDownload(
  requested: SettlementExportHistoryResponse,
  options: { attempts?: number; intervalMs?: number } = {}
): Promise<SettlementExportHistoryResponse> {
  if (requested.deliveryMethod !== 'SERVER_FILE') return requested
  if (isSettlementExportFileReady(requested)) return requested
  if (requested.exportHistoryId == null) return requested

  const attempts = options.attempts ?? 30
  const intervalMs = options.intervalMs ?? 500
  let latest = requested
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    await new Promise(resolve => setTimeout(resolve, intervalMs))
    const page = await fetchSettlementExportHistoriesRemote({
      exportType: requested.exportType,
      page: 0,
      size: 20,
    })
    const found = page.items?.find(item => item.exportHistoryId === requested.exportHistoryId)
    if (!found) continue
    latest = found
    if (
      isSettlementExportFileReady(found) ||
      found.pollingStatus === 'FAILED' ||
      found.exportStatus === 'FAILED'
    ) {
      return found
    }
  }
  return latest
}

/** remote 양식 발급 후 모달/다운로드 진입 전 SERVER_FILE + fileObjectId를 강제한다. */
export function assertSettlementServerExportReady(
  exportHistory: SettlementExportHistoryResponse | null | undefined,
  fallbackMessage = '서버 파일이 준비되지 않았습니다. 클라이언트 파일로 대체하지 않습니다.'
): SettlementExportHistoryResponse {
  if (exportHistory == null) {
    throw new Error(fallbackMessage)
  }
  if (exportHistory.pollingStatus === 'FAILED' || exportHistory.exportStatus === 'FAILED') {
    throw new Error(exportHistory.failureReason || '정산 파일 생성에 실패했습니다.')
  }
  if (exportHistory.deliveryMethod !== 'SERVER_FILE' || !isSettlementExportFileReady(exportHistory)) {
    throw new Error(fallbackMessage)
  }
  return exportHistory
}

export async function fetchSettlementExportHistoriesRemote(
  params: ListExportHistoriesParams
): Promise<PageResponseSettlementExportHistoryResponse> {
  return unwrapApiBody(await settlementApi.listExportHistories(params))
}

export async function fetchCurrentSettlementConfigRemote(): Promise<SettlementConfigResponse> {
  return unwrapApiBody(await settlementApi.currentConfig())
}

export async function updateCurrentSettlementConfigRemote(
  body: SettlementConfigUpdateRequest
): Promise<SettlementConfigResponse> {
  return unwrapApiBody(await settlementApi.updateCurrentConfig(body))
}

export async function duplicateSettlementConfigPaymentItemRemote(
  itemId: number
): Promise<SettlementConfigResponse> {
  return unwrapApiBody(await settlementApi.duplicateConfigItem('payment', itemId))
}

export async function deleteSettlementConfigPaymentItemRemote(
  itemId: number
): Promise<SettlementConfigResponse> {
  return unwrapApiBody(await settlementApi.deleteConfigItem('payment', itemId))
}

export async function fetchSettlementCalendarRemote(fromDate: string, toDate: string) {
  const data = await unwrapApiBody(await settlementApi.settlementCalendar({ fromDate, toDate }))
  return Array.isArray(data) ? data : []
}

export async function fetchSettlementCalendarSummaryRemote(year: number, month: number) {
  return unwrapApiBody(await settlementApi.settlementCalendarSummary({ year, month }))
}

export async function fetchSettlementCalendarDateRemote(date: string) {
  return unwrapApiBody(await settlementApi.settlementCalendarDate(date))
}

/** 페이지네이션 전체 수집 — 클라이언트 집계용 */
export async function fetchAllSettlementsRemote(
  params: Omit<ListSettlementsParams, 'page' | 'size'> = {}
): Promise<PageResponseSettlementListItemResponse['items']> {
  const pageSize = 20
  let page = 0
  const items: NonNullable<PageResponseSettlementListItemResponse['items']> = []

  for (;;) {
    const res = await fetchSettlementsPageRemote({ ...params, page, size: pageSize })
    const batch = res.items ?? []
    items.push(...batch)
    const totalPages = res.totalPages ?? 0
    if (batch.length === 0 || page + 1 >= totalPages) break
    page += 1
  }

  return items
}

export async function fetchAllPaymentStatementsRemote(): Promise<
  NonNullable<PageResponsePaymentStatementListItemResponse['items']>
> {
  const pageSize = 20
  let page = 0
  const items: NonNullable<PageResponsePaymentStatementListItemResponse['items']> = []

  for (;;) {
    const res = await fetchPaymentStatementsPageRemote({ page, size: pageSize })
    const batch = res.items ?? []
    items.push(...batch)
    const totalPages = res.totalPages ?? 0
    if (batch.length === 0 || page + 1 >= totalPages) break
    page += 1
  }

  return items
}

export async function fetchAllAccountPaymentsRemote(
  params: Omit<ListAccountPaymentsParams, 'page' | 'size'> = {}
): Promise<NonNullable<PageResponseAccountPaymentListItemResponse['items']>> {
  /** 시드 ≥32 · 테이블 전량 로드 UX — 왕복 축소 (잘림 방지를 위해 페이지 루프 유지) */
  const pageSize = 20
  let page = 0
  const items: NonNullable<PageResponseAccountPaymentListItemResponse['items']> = []

  for (;;) {
    const res = await fetchAccountPaymentsPageRemote({ ...params, page, size: pageSize })
    const batch = res.items ?? []
    items.push(...batch)
    const totalPages = res.totalPages ?? 0
    if (batch.length === 0 || page + 1 >= totalPages) break
    page += 1
  }

  return items
}
