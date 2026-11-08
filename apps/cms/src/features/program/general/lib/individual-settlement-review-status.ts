import { formatNumberDisplay } from '@/shared/utils'
import { formatDateDot, formatDateTimeDot } from '@/shared/utils/date'
import type { IndividualSettlementReviewDetail } from '@/shared/api/generated/dashboard/schemas/individualSettlementReviewDetail'
import type { IndividualSettlementReviewReceipt } from '@/shared/api/generated/dashboard/schemas/individualSettlementReviewReceipt'
import type { IndividualSettlementReviewRevision } from '@/shared/api/generated/dashboard/schemas/individualSettlementReviewRevision'
import {
  getInstructorSettlementStatusLabel,
  getInstructorSettlementStatusPresentation,
  type InstructorSettlementUiStatus,
} from '@/shared/constants/instructor-settlement-status'

/**
 * 개인 정산(영수증) 검토 상태 → 정산 현황 8종 표시 연결. 서버 값·검토 가능 조건은 바꾸지 않고 표시만 공통화한다.
 * 미신청·철회·작성중은 「해당 없음」. PAID(지급 완료)는 「계좌 지급 완료」.
 */
const INDIVIDUAL_SETTLEMENT_REVIEW_UI_STATUS: Record<string, InstructorSettlementUiStatus> = {
  NONE: 'none',
  WITHDRAWN: 'none',
  DRAFT: 'none',
  SUBMITTED: 'awaiting_confirmation',
  APPROVED: 'payment_statement_verified',
  REJECTED: 'application_rejected',
  PAID: 'account_paid',
}

export function resolveIndividualSettlementReviewUiStatus(
  status: string | null | undefined
): InstructorSettlementUiStatus | null {
  const key = normalizeIndividualSettlementReviewStatus(status)
  if (!key) return 'none'
  return INDIVIDUAL_SETTLEMENT_REVIEW_UI_STATUS[key] ?? null
}

export const INDIVIDUAL_SETTLEMENT_LODGING_NOT_PAYABLE_LABEL = '지급 대상 아님'

export function isIndividualSettlementLodgingType(value: string | null | undefined): boolean {
  return normalizeIndividualSettlementReviewStatus(value) === 'LODGING'
}

export function normalizeIndividualSettlementReviewStatus(
  status: string | null | undefined
): string {
  return (status ?? '').trim().toUpperCase()
}

/** 목록·엑셀 처리 현황 — 상세·산출내역과 같은 라벨 */
export function individualSettlementTableProcessingLabel(
  status: string | null | undefined
): string {
  return individualSettlementReviewStatusLabel(status)
}

export function individualSettlementReviewStatusLabel(status: string | null | undefined): string {
  const uiStatus = resolveIndividualSettlementReviewUiStatus(status)
  if (uiStatus) return getInstructorSettlementStatusLabel(uiStatus)
  return status?.trim() ?? ''
}

export function individualSettlementReviewStatusAccent(status: string | null | undefined): string {
  const uiStatus = resolveIndividualSettlementReviewUiStatus(status)
  return uiStatus
    ? getInstructorSettlementStatusPresentation(uiStatus, 'text').color
    : 'var(--Netural-black, #3d3d3d)'
}

export function formatIndividualSettlementWon(amount: number | null | undefined): string {
  if (amount == null) return '-'
  if (!Number.isFinite(amount)) return '-'
  return `${formatNumberDisplay(amount)}원`
}

export function formatIndividualSettlementDateTime(value: string | null | undefined): string {
  if (!value?.trim()) return '-'
  const formatted = formatDateTimeDot(value)
  return formatted === '-' ? value : formatted
}

export function formatIndividualSettlementDate(value: string | null | undefined): string {
  if (!value?.trim()) return '-'
  const formatted = formatDateDot(value)
  return formatted === '-' ? value : formatted
}

export function latestIndividualSettlementReviewRevision(
  detail: IndividualSettlementReviewDetail | null | undefined
): IndividualSettlementReviewRevision | null {
  const revisions = detail?.revisions ?? []
  if (revisions.length === 0) return null
  const latestNo = detail?.latestRevisionNo
  if (typeof latestNo === 'number') {
    const matched = revisions.find(revision => revision.revisionNo === latestNo)
    if (matched) return matched
  }
  return [...revisions].sort((a, b) => b.revisionNo - a.revisionNo)[0] ?? null
}

export function flattenIndividualSettlementReviewReceipts(
  detail: IndividualSettlementReviewDetail | null | undefined
): IndividualSettlementReviewReceipt[] {
  const latest = latestIndividualSettlementReviewRevision(detail)
  if (latest == null) return []
  return (latest.items ?? []).flatMap(item => item.receipts ?? [])
}

export function canReviewIndividualSettlement(
  detail: IndividualSettlementReviewDetail | null | undefined
): boolean {
  const latest = latestIndividualSettlementReviewRevision(detail)
  if (latest == null) return false
  if (normalizeIndividualSettlementReviewStatus(latest.status) !== 'SUBMITTED') return false
  const actions = (detail?.availableActions ?? []).map(action => action.trim().toUpperCase())
  if (actions.length === 0) return true
  return actions.includes('APPROVE') || actions.includes('REJECT')
}

export function canApproveIndividualSettlement(
  detail: IndividualSettlementReviewDetail | null | undefined
): boolean {
  if (!canReviewIndividualSettlement(detail)) return false
  const actions = (detail?.availableActions ?? []).map(action => action.trim().toUpperCase())
  return actions.length === 0 || actions.includes('APPROVE')
}

export function canRejectIndividualSettlement(
  detail: IndividualSettlementReviewDetail | null | undefined
): boolean {
  if (!canReviewIndividualSettlement(detail)) return false
  const actions = (detail?.availableActions ?? []).map(action => action.trim().toUpperCase())
  return actions.length === 0 || actions.includes('REJECT')
}
