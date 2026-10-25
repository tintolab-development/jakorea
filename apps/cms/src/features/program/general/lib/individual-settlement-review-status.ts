import { formatNumberDisplay } from '@/shared/utils'
import { formatDateDot, formatDateTimeDot } from '@/shared/utils/date'
import type { IndividualSettlementReviewDetail } from '@/shared/api/generated/dashboard/schemas/individualSettlementReviewDetail'
import type { IndividualSettlementReviewReceipt } from '@/shared/api/generated/dashboard/schemas/individualSettlementReviewReceipt'
import type { IndividualSettlementReviewRevision } from '@/shared/api/generated/dashboard/schemas/individualSettlementReviewRevision'

export const INDIVIDUAL_SETTLEMENT_REVIEW_STATUS_LABELS = {
  NONE: '미신청',
  SUBMITTED: '확인 대기 중',
  APPROVED: '영수증 확인 완료',
  REJECTED: '신청 반려',
  WITHDRAWN: '철회',
  DRAFT: '작성중',
} as const

export const INDIVIDUAL_SETTLEMENT_LODGING_NOT_PAYABLE_LABEL = '지급 대상 아님'

export function isIndividualSettlementLodgingType(value: string | null | undefined): boolean {
  return normalizeIndividualSettlementReviewStatus(value) === 'LODGING'
}

export type IndividualSettlementReviewStatusKey =
  keyof typeof INDIVIDUAL_SETTLEMENT_REVIEW_STATUS_LABELS

export function normalizeIndividualSettlementReviewStatus(
  status: string | null | undefined
): string {
  return (status ?? '').trim().toUpperCase()
}

export function individualSettlementReviewStatusLabel(
  status: string | null | undefined
): string {
  const key = normalizeIndividualSettlementReviewStatus(status)
  if (!key) return INDIVIDUAL_SETTLEMENT_REVIEW_STATUS_LABELS.NONE
  if (key === 'PAID') return key
  if (key in INDIVIDUAL_SETTLEMENT_REVIEW_STATUS_LABELS) {
    return INDIVIDUAL_SETTLEMENT_REVIEW_STATUS_LABELS[key as IndividualSettlementReviewStatusKey]
  }
  return status?.trim() || INDIVIDUAL_SETTLEMENT_REVIEW_STATUS_LABELS.NONE
}

export function individualSettlementReviewStatusAccent(
  status: string | null | undefined
): string {
  const key = normalizeIndividualSettlementReviewStatus(status)
  if (key === 'SUBMITTED') return 'var(--color-orange, #f07917)'
  if (key === 'APPROVED') return 'var(--color-green, #1e8c29)'
  if (key === 'REJECTED') return 'var(--color-red, #c32f4a)'
  if (key === 'WITHDRAWN' || key === 'DRAFT') return 'var(--default-BK, #3d3d3d)'
  return 'var(--default-BK, #3d3d3d)'
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
