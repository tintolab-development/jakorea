import type {
  AccountPaymentRow,
  AccountPaymentStatusDetail,
} from '@/data/mock/account-payments-list'
import { ACCOUNT_PAYMENT_STATUS_LABELS } from '@/data/mock/account-payments-list'
import type {
  PaymentOrderCalculationStatementLine,
  PaymentOrderCalculationStatementSessionBlock,
} from '@/data/mock/payment-order-admin-list'
import type {
  SettlementFrontendItemResponse,
  SettlementFrontendResponse,
  SettlementListItemResponse,
} from '@/shared/api/generated/settlement/schemas'
import { formatLectureSessionLabel } from '@/features/settlement-management/api/account-payments/map-settlement-context'
import { formatPaymentOrderCalculationItemLabel } from '@/shared/constants/settlement-item-type'

const KO_WEEKDAY = ['일', '월', '화', '수', '목', '금', '토'] as const

function formatTransferDateDisplay(iso: string): string {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  const date = new Date(y, m - 1, d)
  const dow = KO_WEEKDAY[date.getDay()]
  return `${y}. ${String(m).padStart(2, '0')}. ${String(d).padStart(2, '0')}(${dow})`
}

function formatLectureDateDisplay(iso: string | undefined): string {
  if (!iso) return '—'
  return formatTransferDateDisplay(iso)
}

function mapItemToCalcLine(
  item: SettlementFrontendItemResponse,
  index: number
): PaymentOrderCalculationStatementLine {
  const amount = item.amount ?? 0
  return {
    id: `calc-line-api-${index}`,
    itemLabel: formatPaymentOrderCalculationItemLabel(item.type, amount),
    description: item.description?.trim() || '—',
    amount,
    kind: amount < 0 ? 'withholding' : 'lecture_fee',
  }
}

function buildBlocksFromSettlement(
  row: AccountPaymentRow,
  settlementListItem: SettlementListItemResponse | undefined,
  settlement: SettlementFrontendResponse
): PaymentOrderCalculationStatementSessionBlock[] {
  const items = settlement.items ?? []
  const lines = items.map(mapItemToCalcLine)

  if (lines.length === 0) {
    lines.push({
      id: 'calc-line-api-fallback',
      itemLabel: '정산 예정',
      description: '계좌 지급 확인',
      amount: row.amount,
      kind: 'lecture_fee',
    })
  }

  const lectureDate = settlementListItem?.lectureDate ?? row.transferScheduledDate
  const sessionLabel = formatLectureSessionLabel(settlementListItem?.scheduleId)

  return [
    {
      institutionName: row.institutionName !== '-' ? row.institutionName : '—',
      lectureDateDisplay: formatLectureDateDisplay(lectureDate),
      lectureSessionDisplay: sessionLabel.replace(/차시/g, '회차'),
      lines,
    },
  ]
}

function sumItemsAmount(items: SettlementFrontendItemResponse[] | undefined): number {
  return (items ?? []).reduce((sum, item) => sum + (item.amount ?? 0), 0)
}

export function mapAccountPaymentDetailRemote(
  row: AccountPaymentRow,
  settlement: SettlementFrontendResponse,
  settlementListItem?: SettlementListItemResponse
): AccountPaymentStatusDetail {
  const blocks = buildBlocksFromSettlement(row, settlementListItem, settlement)
  const itemsTotal = sumItemsAmount(settlement.items)
  const totalAmount = settlement.totalAmount ?? (itemsTotal !== 0 ? itemsTotal : row.amount)

  const bankAndNumber = [row.bankName, row.maskedAccountNo].filter(Boolean).join(' ') || '—'

  return {
    basic: {
      nameKo: row.instructorName,
      nameEn: '—',
      phoneDisplay: '—',
      emailDisplay: '—',
      addressDisplay: '—',
      settlementAccountBankNumberPart: bankAndNumber,
      settlementAccountHolderPart: row.accountHolder?.trim() || '—',
      programName: row.programName,
      programSessionProgressDisplay: row.sessionLabel !== '-' ? row.sessionLabel.replace(/차시/g, '회차') : '—',
      businessPeriodDisplay: settlement.period?.trim() || '—',
      accountPaymentStatus: row.accountPaymentStatus,
      accountPaymentStatusLabel: ACCOUNT_PAYMENT_STATUS_LABELS[row.accountPaymentStatus],
      transferScheduledDateDisplay: formatTransferDateDisplay(row.transferScheduledDate),
      lectureFeeStandardTitle: '—',
      lectureFeeStandardAmount: row.amount > 0 ? `${row.amount.toLocaleString('ko-KR')}원` : '—',
      businessIncomeEarnerLabel: '해당 없음',
    },
    blocks,
    formulaLabel: '정산 항목 합계',
    totalAmount,
    plainAccountForPaymentConfirm: {
      bankAndNumber,
      holder: row.accountHolder?.trim() || row.instructorName,
    },
  }
}
