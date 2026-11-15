import {
  mapSettlementsToInstructorRows,
  mapSettlementsToProgramRows,
} from '@/features/settlement-management/api/payment-orders/map-settlement-list-rows'
import {
  mapAggregatesToInstructorRows,
  mapAggregatesToProgramRows,
} from '@/features/settlement-management/api/payment-orders/map-settlement-aggregates'
import {
  buildPaymentOrdersListAggregateParams,
  type PaymentOrdersListFilterInput,
} from '@/features/settlement-management/api/payment-orders/build-payment-orders-list-aggregate-params'
import {
  fetchAllPaymentStatementsRemote,
  fetchAllSettlementsRemote,
  fetchSettlementAggregatesRemote,
} from '@/features/settlement-management/api/settlement-api-client'
import type {
  ListSettlementAggregatesParams,
  ListSettlementsParams,
  SettlementAggregateResponse,
} from '@/shared/api/generated/settlement/schemas'
import type {
  PaymentOrderAdminInstructorRow,
  PaymentOrderAdminProgramRow,
} from '@/features/settlement-management/model/payment-order-admin-list'
import type { PaymentOrderPayeeTypeFilter } from '@/pages/settlement-management/payment-orders-table.config'
import { needsPaymentStatementJoin } from '@/features/settlement-management/api/shared/map-frontend-fields'

export interface PaymentOrdersListData {
  programRows: PaymentOrderAdminProgramRow[]
  instructorRows: PaymentOrderAdminInstructorRow[]
}

export type PaymentOrdersDetailContextParams = {
  type: 'program' | 'instructor'
  aggregateKey: string
  /** 목록(지급조서 확인)에 조회 적용된 출강일 기간 — 상세 라인 API 스코프 */
  dateRange?: { from?: string; to?: string } | null
  /** 상세 필터 「신청자명/프로그램명」 → settlements `search` */
  search?: string | null
  /** 상세 필터 「지급조서 처리 현황」 → `statementStatus` (all이면 생략) */
  statementStatus?: string | null
  /** 목록에 조회 적용된 정산 대상자 구분 → `payeeType` (all·없으면 생략) */
  payeeType?: PaymentOrderPayeeTypeFilter | null
}

export function buildPaymentOrdersDetailListParams(
  params: PaymentOrdersDetailContextParams
): Omit<ListSettlementsParams, 'page' | 'size'> {
  const id = Number(params.aggregateKey)
  if (!Number.isFinite(id)) return {}

  /**
   * 강사별 상세도 지급조서 확인 목록이다.
   * instructorMemberId를 붙이면 회원 상세 정산 탭 조회가 되어 신청서 행이 빠지고 CONFIRMED가 남는다.
   * 강사 좁히기는 응답을 받은 뒤 instructorMemberId로 거른다.
   */
  const listParams: Omit<ListSettlementsParams, 'page' | 'size'> =
    params.type === 'program' ? { programId: id } : {}

  if (params.dateRange?.from) listParams.fromDate = params.dateRange.from
  if (params.dateRange?.to) listParams.toDate = params.dateRange.to

  const search = params.search?.trim()
  if (search) {
    listParams.search = search
  }

  const statementStatus = params.statementStatus?.trim()
  if (statementStatus) {
    listParams.statementStatus = statementStatus
  }

  if (params.payeeType && params.payeeType !== 'all') {
    listParams.payeeType = params.payeeType
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

/** aggregates API 한 쪽 최대 건수(BE `size` 상한 100) */
export const SETTLEMENT_AGGREGATES_PAGE_SIZE = 100
/** 무한 반복 방지 — 100건 × 50쪽 */
const SETTLEMENT_AGGREGATES_MAX_PAGES = 50

/**
 * `GET /settlements/aggregates`는 전체 건수 없이 배열만 주고 기본 20건에서 자른다.
 * 100건씩 쪽을 늘려 받다가 100건보다 적게 오면 멈추고 합친다.
 */
export async function fetchAllSettlementAggregatesRemote(
  params: Omit<ListSettlementAggregatesParams, 'page' | 'size'>
): Promise<SettlementAggregateResponse[]> {
  const all: SettlementAggregateResponse[] = []
  for (let page = 0; page < SETTLEMENT_AGGREGATES_MAX_PAGES; page += 1) {
    const chunk = await fetchSettlementAggregatesRemote({
      ...params,
      page,
      size: SETTLEMENT_AGGREGATES_PAGE_SIZE,
    })
    all.push(...chunk)
    if (chunk.length < SETTLEMENT_AGGREGATES_PAGE_SIZE) break
  }
  return all
}

export async function getPaymentOrdersListRemote(
  groupBy: 'program' | 'instructor',
  filters: PaymentOrdersListFilterInput = {
    programName: '',
    instructorName: '',
    processingStatus: 'all',
    pendingItemBucket: 'all',
    dateRange: null,
  }
): Promise<PaymentOrdersListData> {
  const aggregates = await fetchAllSettlementAggregatesRemote(
    buildPaymentOrdersListAggregateParams(groupBy, filters)
  )
  if (groupBy === 'program') {
    return {
      programRows: mapAggregatesToProgramRows(aggregates),
      instructorRows: [],
    }
  }
  return {
    programRows: [],
    instructorRows: mapAggregatesToInstructorRows(aggregates),
  }
}

/** @deprecated aggregates API 미사용 fallback — 테스트·마이그레이션용 */
export async function getPaymentOrdersListRemoteFromSettlements(): Promise<PaymentOrdersListData> {
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
  if (!needsPaymentStatementJoin(items)) {
    return { items, statements: [] }
  }
  const settlementIds = items
    .map(item => item.settlementId)
    .filter((id): id is number => id != null)
  const statements = await fetchPaymentStatementsForSettlementIds(settlementIds)
  return { items, statements }
}
