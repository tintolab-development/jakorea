import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import { getJAKoreaCMSBackendAPISettlementSubset } from '@/shared/api/generated/settlement/settlement-api'
import type {
  ListAccountPaymentsParams,
  ListExportHistoriesParams,
  ListPaymentStatementsParams,
  ListSettlementsParams,
  PageResponseAccountPaymentListItemResponse,
  PageResponsePaymentStatementListItemResponse,
  PageResponseSettlementExportHistoryResponse,
  PageResponseSettlementListItemResponse,
  SettlementConfigResponse,
  SettlementDocumentDownloadResponse,
  SettlementExportRequest,
  SettlementFrontendResponse,
  SettlementStatusChangeRequest,
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

export async function confirmPaymentStatementRemote(
  statementId: number,
  body: SettlementStatusChangeRequest = { reason: '' }
): Promise<void> {
  await settlementApi.confirmPaymentStatement(statementId, body)
}

export async function downloadPaymentStatementRemote(
  settlementId: number
): Promise<SettlementDocumentDownloadResponse> {
  return unwrapApiBody(await settlementApi.downloadPaymentStatement(settlementId))
}

export async function fetchAccountPaymentsPageRemote(
  params: ListAccountPaymentsParams
): Promise<PageResponseAccountPaymentListItemResponse> {
  return unwrapApiBody(await settlementApi.listAccountPayments(params))
}

export async function markAccountPaymentPaidRemote(
  paymentId: number,
  body: SettlementStatusChangeRequest = { reason: '' }
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
): Promise<void> {
  await settlementApi.requestBulkTransferExport(body)
}

export async function requestTaxReportExportRemote(body: SettlementExportRequest): Promise<void> {
  await settlementApi.requestTaxReportExport(body)
}

export async function fetchSettlementExportHistoriesRemote(
  params: ListExportHistoriesParams
): Promise<PageResponseSettlementExportHistoryResponse> {
  return unwrapApiBody(await settlementApi.listExportHistories(params))
}

export async function fetchCurrentSettlementConfigRemote(): Promise<SettlementConfigResponse> {
  return unwrapApiBody(await settlementApi.currentConfig())
}

export async function fetchSettlementCalendarRemote(
  fromDate: string,
  toDate: string
) {
  const data = await unwrapApiBody(
    await settlementApi.settlementCalendar({ fromDate, toDate })
  )
  return Array.isArray(data) ? data : []
}

export async function fetchSettlementCalendarSummaryRemote(year: number, month: number) {
  return unwrapApiBody(
    await settlementApi.settlementCalendarSummary({ year, month })
  )
}

export async function fetchSettlementCalendarDateRemote(date: string) {
  return unwrapApiBody(await settlementApi.settlementCalendarDate(date))
}

/** 페이지네이션 전체 수집 — 클라이언트 집계용 */
export async function fetchAllSettlementsRemote(
  params: Omit<ListSettlementsParams, 'page' | 'size'> = {}
): Promise<PageResponseSettlementListItemResponse['items']> {
  const pageSize = 200
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
  const pageSize = 200
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
  const pageSize = 200
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
