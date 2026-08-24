import {
  mapSettlementsToInstructorRows,
  mapSettlementsToProgramRows,
} from '@/features/settlement-management/api/payment-orders/map-settlement-list-rows'
import {
  fetchAllPaymentStatementsRemote,
  fetchAllSettlementsRemote,
} from '@/features/settlement-management/api/settlement-api-client'
import type { ListSettlementsParams } from '@/shared/api/generated/settlement/schemas'
import type {
  PaymentOrderAdminInstructorRow,
  PaymentOrderAdminProgramRow,
} from '@/data/mock/payment-order-admin-list'

export interface PaymentOrdersListData {
  programRows: PaymentOrderAdminProgramRow[]
  instructorRows: PaymentOrderAdminInstructorRow[]
}

export type PaymentOrdersDetailContextParams = {
  type: 'program' | 'instructor'
  aggregateKey: string
  /** 목록(지급조서 확인)에 조회 적용된 출강일 기간 — 상세 라인 API 스코프 */
  dateRange?: { from: string; to: string } | null
}

export function buildPaymentOrdersDetailListParams(
  params: PaymentOrdersDetailContextParams
): Omit<ListSettlementsParams, 'page' | 'size'> {
  const id = Number(params.aggregateKey)
  if (!Number.isFinite(id)) return {}

  const listParams: Omit<ListSettlementsParams, 'page' | 'size'> =
    params.type === 'program' ? { programId: id } : { instructorMemberId: id }

  if (params.dateRange?.from && params.dateRange?.to) {
    listParams.fromDate = params.dateRange.from
    listParams.toDate = params.dateRange.to
  }

  return listParams
}

async function fetchPaymentStatementsForSettlementIds(settlementIds: number[]) {
  if (settlementIds.length === 0) return []
  const idSet = new Set(settlementIds)
  const all = await fetchAllPaymentStatementsRemote()
  return all.filter(
    statement => statement.settlementId != null && idSet.has(statement.settlementId)
  )
}

export async function getPaymentOrdersListRemote(): Promise<PaymentOrdersListData> {
  const items = (await fetchAllSettlementsRemote()) ?? []
  return {
    programRows: mapSettlementsToProgramRows(items),
    instructorRows: mapSettlementsToInstructorRows(items),
  }
}

/** 프로그램/강사 aggregateKey + (선택) 목록 기간으로 정산 라인·statementId 매핑 조회 */
export async function getPaymentOrdersDetailContextRemote(
  params: PaymentOrdersDetailContextParams
) {
  const listParams = buildPaymentOrdersDetailListParams(params)
  const items = (await fetchAllSettlementsRemote(listParams)) ?? []
  const settlementIds = items
    .map(item => item.settlementId)
    .filter((id): id is number => id != null)
  const statements = await fetchPaymentStatementsForSettlementIds(settlementIds)
  return { items, statements }
}
