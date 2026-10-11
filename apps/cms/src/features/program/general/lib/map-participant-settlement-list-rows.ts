import dayjs from 'dayjs'
import type { ParticipantSettlementListItemResponse } from '@/features/program/general/api/participating-participant-settlements-remote'

export type ParticipatingParticipantSettlementRow = {
  no: number
  receiptId: number
  submittedAtLabel: string
  itemSummary: string
  amount: number | null
  receiptStatus: string
  receiptStatusLabel: string
  paymentStatusLabel: string
}

const RECEIPT_STATUS_LABEL: Record<string, string> = {
  SUBMITTED: '검토 대기',
  APPROVED: '승인',
  REJECTED: '반려',
}

function formatSubmittedAt(value?: string): string {
  if (!value?.trim()) return '-'
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format('YYYY.MM.DD HH:mm') : value
}

function formatReceiptStatus(status?: string): string {
  const key = (status ?? '').trim().toUpperCase()
  if (!key) return '-'
  return RECEIPT_STATUS_LABEL[key] ?? status ?? '-'
}

function formatPaymentStatus(status?: string | null): string {
  const trimmed = status?.trim()
  return trimmed || '-'
}

export function mapParticipantSettlementsToRows(
  items: ParticipantSettlementListItemResponse[]
): ParticipatingParticipantSettlementRow[] {
  return items.map((item, index) => ({
    no: index + 1,
    receiptId: item.receiptId ?? 0,
    submittedAtLabel: formatSubmittedAt(item.submittedAt),
    itemSummary: item.itemSummary?.trim() || '-',
    amount: item.amount ?? null,
    receiptStatus: (item.receiptStatus ?? '').trim(),
    receiptStatusLabel: formatReceiptStatus(item.receiptStatus),
    paymentStatusLabel: formatPaymentStatus(item.paymentStatus),
  }))
}
