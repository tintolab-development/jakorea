import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import { getJAKoreaCMSBackendAPISettlementSubset } from '@/shared/api/generated/settlement/settlement-api'
import customInstance from '@/shared/api/orval-mutator'
import { postEncryptedAdminFile } from '@/shared/lib/post-encrypted-admin-file'
import type { SettlementExportResponse } from '@/features/settlement-management/api/account-payments/settlement-export-response'
import {
  parseTaxReportPreviewWorkbook,
  type TaxReportPreviewWorkbook,
} from '@/features/settlement-management/api/account-payments/tax-report-preview'
import type {
  AccountPaymentDetailResponse,
  BudgetSummaryParams,
  ListAccountPaymentsParams,
  ListExportHistoriesParams,
  ListPaymentStatementsParams,
  ListSettlementAggregatesParams,
  ListTransportationSnapshotsParams,
  ListSettlementsParams,
  PageResponseAccountPaymentListItemResponse,
  PageResponsePaymentStatementListItemResponse,
  PageResponseSettlementExportHistoryResponse,
  PageResponseSettlementListItemResponse,
  PageResponseSettlementTransportationSnapshotResponse,
  SettlementBudgetSummaryResponse,
  SettlementBulkStatusChangeRequest,
  SettlementConfigResponse,
  SettlementCorrectionApprovalRequest,
  SettlementCorrectionRequest,
  SettlementCorrectionResponse,
  SettlementExportRequest,
  SettlementExportHistoryResponse,
  SettlementFrontendResponse,
  SettlementStatusChangeRequest,
  SettlementAggregateResponse,
  SettlementConfigUpdateRequest,
} from '@/shared/api/generated/settlement/schemas'
import type { SettlementListResponse } from '@/shared/api/generated/settlement/schemas/settlementListResponse'
import type { SettlementApplicationDocumentResponse } from '@/shared/api/generated/settlement/schemas'

const settlementApi = getJAKoreaCMSBackendAPISettlementSubset()

export async function fetchSettlementsPageRemote(
  params: ListSettlementsParams
): Promise<PageResponseSettlementListItemResponse> {
  return unwrapApiBody(await settlementApi.listSettlements(params))
}

/** `GET /api/admin/settlements` 원 응답 (instructorSessionSummary 포함). 기존 페이지 호출은 fetchSettlementsPageRemote 유지 */
export async function fetchSettlementListPageRemote(
  params: ListSettlementsParams
): Promise<SettlementListResponse> {
  return unwrapApiBody(await settlementApi.listSettlements(params))
}

export async function fetchPaymentStatementsPageRemote(
  params: ListPaymentStatementsParams
): Promise<PageResponsePaymentStatementListItemResponse> {
  return unwrapApiBody(
    await customInstance({
      url: '/api/admin/settlements/statements',
      method: 'GET',
      params,
    })
  )
}

export async function fetchSettlementDetailRemote(
  settlementId: number
): Promise<SettlementFrontendResponse> {
  return unwrapApiBody(await settlementApi.getSettlement(settlementId))
}

/**
 * 확정 전 정산 신청서 지급조서 (제출 revision 스냅샷). revisionNo 생략 시 최신 revision.
 * 403/404여도 포털 본인 API나 다른 정산 API로 재시도하지 않는다.
 */
export async function fetchSettlementApplicationDocumentRemote(
  applicationId: number,
  revisionNo?: number
): Promise<SettlementApplicationDocumentResponse> {
  return unwrapApiBody(
    await settlementApi.getAdminSettlementApplicationDocument(
      applicationId,
      revisionNo != null ? { revisionNo } : undefined
    )
  )
}

export async function fetchSettlementTransportationSnapshotsRemote(
  settlementId: number
): Promise<PageResponseSettlementTransportationSnapshotResponse['items']> {
  const query: ListTransportationSnapshotsParams = { settlementId, page: 0, size: 20 }
  const page = unwrapApiBody<PageResponseSettlementTransportationSnapshotResponse>(
    await customInstance({
      url: '/api/admin/settlements/transportation-snapshots',
      method: 'GET',
      params: query,
    })
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
  await unwrapApiBody(
    await customInstance({
      url: '/api/admin/account-payments/bulk-paid',
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      data: body,
    })
  )
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

/** POST 암호화 PDF 스트림. GET preview JSON/downloadUrl은 쓰지 않는다. */
export async function downloadPaymentStatementRemote(
  settlementId: number,
  options: { password: string }
): Promise<void> {
  await postEncryptedAdminFile({
    url: `/api/admin/settlements/${settlementId}/payment-statement/download`,
    password: options.password,
    fallbackFileName: `지급조서_${settlementId}.pdf`,
    alternateUrls: [`/api/admin/settlements/${settlementId}/payment-statement/download-requests`],
  })
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

/** 지급 정정 승인 — 새 정산(재신청)이 생기고 원 정산은 대체된다. 강사 알림은 BE가 발송. */
export async function approveSettlementCorrectionRemote(
  correctionRequestId: number,
  body: SettlementCorrectionApprovalRequest
): Promise<SettlementCorrectionResponse | null> {
  return (
    unwrapApiBody<SettlementCorrectionResponse | null>(
      await settlementApi.approveCorrection(correctionRequestId, body)
    ) ?? null
  )
}

/** 지급 정정 요청 반려 — 강사 요청 건은 지급조서 상태가 요청 전으로 돌아간다. */
export async function rejectSettlementCorrectionRemote(
  correctionRequestId: number,
  reason: string
): Promise<void> {
  await settlementApi.rejectCorrection(correctionRequestId, { reason })
}

export type SettlementNotificationResendRequestBody = {
  timing: 'IMMEDIATE' | 'SCHEDULED'
  scheduledAt?: string | null
  reason?: string | null
}

/**
 * POST /api/admin/settlements/{settlementId}/notifications/resend
 * 최신 statementStatus·paymentStatus로 기존 알림만 재enqueue. 업무 상태는 바꾸지 않는다.
 */
export async function resendSettlementNotificationRemote(
  settlementId: number,
  body: SettlementNotificationResendRequestBody,
  idempotencyKey: string
): Promise<void> {
  await unwrapApiBody(
    await customInstance({
      url: `/api/admin/settlements/${settlementId}/notifications/resend`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      data: {
        timing: body.timing,
        ...(body.scheduledAt != null ? { scheduledAt: body.scheduledAt } : {}),
        ...(body.reason != null ? { reason: body.reason } : {}),
      },
    })
  )
}

export async function requestSettlementCorrectionRemote(
  settlementId: number,
  body: SettlementCorrectionRequest
): Promise<void> {
  await customInstance({
    url: `/api/admin/settlements/${settlementId}/correction-requests`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
  })
}

/** 선택 정산 건 지급조서 ZIP — POST blob. job 폴링/CLIENT_RENDER 없음. */
export async function bulkDownloadPaymentStatementsRemote(body: {
  settlementIds: number[]
  password: string
}): Promise<void> {
  await postEncryptedAdminFile({
    url: '/api/admin/settlements/payment-statements/bulk-download/jobs',
    password: body.password,
    extraBody: { settlementIds: body.settlementIds },
    fallbackFileName: '지급조서_일괄.zip',
  })
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
  await customInstance({
    url: `/api/admin/account-payments/${paymentId}/paid`,
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    data: body,
  })
}

export async function markAccountPaymentFailedRemote(
  paymentId: number,
  body: SettlementStatusChangeRequest = { reason: '' }
): Promise<void> {
  await customInstance({
    url: `/api/admin/account-payments/${paymentId}/failed`,
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    data: body,
  })
}

export async function requestBulkTransferExportRemote(
  body: SettlementExportRequest
): Promise<SettlementExportHistoryResponse> {
  return unwrapApiBody<SettlementExportHistoryResponse>(
    await customInstance({
      url: '/api/admin/settlements/exports/bulk-transfer',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: body,
    })
  )
}

export async function requestTaxReportExportRemote(
  body: SettlementExportRequest
): Promise<SettlementExportResponse> {
  // 현재 generated operation은 options만 받아 body를 전송하지 않으므로
  // OpenAPI가 갱신될 때까지 이 adapter에서 인증된 JSON POST를 단 한 번 보낸다.
  return unwrapApiBody<SettlementExportResponse>(
    await customInstance({
      url: '/api/admin/settlements/exports/tax-report',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: body,
    })
  )
}

/** 서버 canonical TAX_REPORT_FORTUNE_V1 dataset — 미리보기 전용 조회 */
export async function requestTaxReportPreviewRemote(
  settlementIds: number[]
): Promise<TaxReportPreviewWorkbook> {
  const payload = await customInstance<unknown>({
    url: '/api/admin/settlements/exports/tax-report/preview',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: { settlementIds },
  })
  return parseTaxReportPreviewWorkbook(unwrapApiBody(payload))
}

/** sensitive SERVER_FILE 다운로드는 downloadUrl 대신 fileObjectId로 받는다. */
export function isSettlementExportFileReady(
  exportHistory: SettlementExportResponse | null | undefined
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
  requested: SettlementExportResponse,
  options: { attempts?: number; intervalMs?: number } = {}
): Promise<SettlementExportResponse> {
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
  exportHistory: SettlementExportResponse | null | undefined,
  fallbackMessage = '서버 파일이 준비되지 않았습니다. 클라이언트 파일로 대체하지 않습니다.'
): SettlementExportResponse {
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
  return unwrapApiBody(
    await customInstance({
      url: '/api/admin/settlements/exports',
      method: 'GET',
      params,
    })
  )
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
  return unwrapApiBody(
    await customInstance({
      url: '/api/admin/settlements/calendar/summary',
      method: 'GET',
      params: { year, month },
    })
  )
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
