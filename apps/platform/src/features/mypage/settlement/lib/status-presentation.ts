import { PAYMENT_STATEMENT_AGGREGATE_LABEL } from '../../education/settlements/lib/payment-statement-status.ts'
import type { SettlementOverviewStatus, SettlementOverviewStatusFilter } from '../model/types.ts'

export const SETTLEMENT_STATUS_LIST_LABEL: Record<SettlementOverviewStatus, string> = {
  waiting_confirm: PAYMENT_STATEMENT_AGGREGATE_LABEL.awaiting_confirmation,
  confirmed: PAYMENT_STATEMENT_AGGREGATE_LABEL.payment_statement_verified,
  paid: PAYMENT_STATEMENT_AGGREGATE_LABEL.account_paid,
  rejected: PAYMENT_STATEMENT_AGGREGATE_LABEL.application_rejected,
  correction_requested: PAYMENT_STATEMENT_AGGREGATE_LABEL.payment_correction_requested,
  reapplied: PAYMENT_STATEMENT_AGGREGATE_LABEL.payment_statement_reapplication,
}

/** 개인·봉사자 영수증 행 목록 라벨 (R17, USER-FUNC-0163) — "지급조서 확인 완료" 금지 */
export const RECEIPT_STATUS_LIST_LABEL: Record<SettlementOverviewStatus, string> = {
  waiting_confirm: '확인 대기',
  confirmed: '확인 완료',
  paid: '계좌 지급 완료',
  rejected: '신청 반려',
  correction_requested: PAYMENT_STATEMENT_AGGREGATE_LABEL.payment_correction_requested,
  reapplied: '영수증 재신청',
}

export function settlementStatusListLabel(item: {
  status: SettlementOverviewStatus
  documentKind?: 'receipt' | 'payment_statement'
}): string {
  return item.documentKind === 'receipt'
    ? RECEIPT_STATUS_LIST_LABEL[item.status]
    : SETTLEMENT_STATUS_LIST_LABEL[item.status]
}

export const SETTLEMENT_STATUS_CALENDAR_SHORT: Record<SettlementOverviewStatus, string> = {
  waiting_confirm: '신청 완료',
  confirmed: '확인 완료',
  correction_requested: '정정 요청',
  reapplied: '재신청',
  rejected: '신청 반려',
  paid: '지급 완료',
}

export const SETTLEMENT_STATUS_LIST_COLOR: Record<SettlementOverviewStatus, string> = {
  waiting_confirm: '#232323',
  confirmed: '#232323',
  correction_requested: '#232323',
  reapplied: '#232323',
  rejected: '#c31d20',
  paid: '#01a1af',
}

export const SETTLEMENT_CALENDAR_EVENT_COLORS: Record<
  SettlementOverviewStatus,
  { accent: string; background: string }
> = {
  waiting_confirm: { accent: '#C593FF', background: '#F3E8FF' },
  confirmed: { accent: '#9FE35B', background: '#E7F7D7' },
  correction_requested: { accent: '#F5CC00', background: '#FFF7CF' },
  reapplied: { accent: '#9EE9F7', background: '#E3FAFF' },
  rejected: { accent: '#FA8484', background: '#FFE3E3' },
  paid: { accent: '#557BFA', background: '#E0E7FF' },
}

export const SETTLEMENT_CALENDAR_LEGEND_ORDER: SettlementOverviewStatus[] = [
  'waiting_confirm',
  'confirmed',
  'correction_requested',
  'reapplied',
  'rejected',
  'paid',
]

export const SETTLEMENT_STATUS_FILTER_OPTIONS: {
  value: SettlementOverviewStatusFilter
  label: string
}[] = [
  { value: 'all', label: '전체' },
  { value: 'waiting_confirm', label: SETTLEMENT_STATUS_LIST_LABEL.waiting_confirm },
  { value: 'confirmed', label: SETTLEMENT_STATUS_LIST_LABEL.confirmed },
  { value: 'paid', label: SETTLEMENT_STATUS_LIST_LABEL.paid },
  { value: 'rejected', label: SETTLEMENT_STATUS_LIST_LABEL.rejected },
  { value: 'correction_requested', label: SETTLEMENT_STATUS_LIST_LABEL.correction_requested },
  { value: 'reapplied', label: SETTLEMENT_STATUS_LIST_LABEL.reapplied },
]
