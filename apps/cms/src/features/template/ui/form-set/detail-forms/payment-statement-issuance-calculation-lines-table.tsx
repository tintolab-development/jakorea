/**
 * 지급조서(발급용) — 「강의비 산출 내역」표.
 * Ant Design Table(scroll/sticky)은 A4 미리보기에서 보더·레이아웃이 깨지므로
 * 편집·미리보기 동일하게 네이티브 HTML 테이블로 렌더한다.
 */

import { useMemo } from 'react'
import type {
  PaymentOrderCalculationLineKind,
  PaymentOrderCalculationStatementSessionBlock,
} from '@/data/mock/payment-order-admin-list'
import { withProgramDetailTdDivider } from '@/features/program/shared/ui/program-detail-td-divider'
import { formatPaymentOrderCalculationWonPlain } from '@/features/settlement/ui/payment-record/payment-order-calculation-breakdown-table'
import './payment-statement-issuance-calculation-lines-table.css'

export interface PaymentStatementIssuanceCalculationLinesRow {
  key: string
  blockRowSpan: number
  isFirstInBlock: boolean
  institutionName: string
  lectureDateDisplay: string
  lectureSessionDisplay: string
  paymentDeductionLabel: string
  categoryLabel: string
  itemLabel: string
  amount: number
  lineId: string
  amountDisplayOverride?: string
}

function paymentDeductionLabel(kind: PaymentOrderCalculationLineKind): string {
  return kind === 'withholding' ? '공제' : '지급'
}

/** 발급용 시안 구분 라벨 (정산 모달과 별도) */
function categoryLabel(kind: PaymentOrderCalculationLineKind): string {
  switch (kind) {
    case 'lecture_fee':
      return '3급'
    case 'travel':
      return '왕복'
    case 'lodging':
      return '1사1교'
    case 'meal':
      return '식사'
    case 'activity':
      return '활동'
    case 'withholding':
      return '기타소득'
    default:
      return ''
  }
}

export function buildPaymentStatementIssuanceCalculationLinesRows(
  blocks: PaymentOrderCalculationStatementSessionBlock[]
): PaymentStatementIssuanceCalculationLinesRow[] {
  const out: PaymentStatementIssuanceCalculationLinesRow[] = []
  blocks.forEach((block, bi) => {
    const span = block.lines.length
    block.lines.forEach((line, li) => {
      out.push({
        key: `${bi}-${line.id}`,
        blockRowSpan: span,
        isFirstInBlock: li === 0,
        institutionName: block.institutionName,
        lectureDateDisplay: block.lectureDateDisplay,
        lectureSessionDisplay: block.lectureSessionDisplay,
        paymentDeductionLabel: paymentDeductionLabel(line.kind),
        categoryLabel: categoryLabel(line.kind),
        itemLabel: line.itemLabel,
        amount: line.amount,
        lineId: line.id,
        amountDisplayOverride: line.amountDisplayOverride,
      })
    })
  })
  return out
}

function renderAmountText(amount: number, row: PaymentStatementIssuanceCalculationLinesRow) {
  if (row.amountDisplayOverride) return row.amountDisplayOverride
  return formatPaymentOrderCalculationWonPlain(amount)
}

export type PaymentStatementIssuanceCalculationLinesTableProps = {
  blocks: PaymentOrderCalculationStatementSessionBlock[]
  formulaLabel: string
  totalAmount: number
  className?: string
}

export function PaymentStatementIssuanceCalculationLinesTable({
  blocks,
  formulaLabel,
  totalAmount,
  className,
}: PaymentStatementIssuanceCalculationLinesTableProps) {
  const tableRows = useMemo(() => buildPaymentStatementIssuanceCalculationLinesRows(blocks), [blocks])

  const rootClass = [
    'payment-statement-issuance-calculation-lines-table',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="payment-statement-issuance-calculation-lines-table__wrap">
      <div className="payment-statement-issuance-calculation-lines-table__radius">
        <table className={rootClass}>
          <colgroup>
            <col className="payment-statement-issuance-calculation-lines-table__col--institution" />
            <col className="payment-statement-issuance-calculation-lines-table__col--date" />
            <col className="payment-statement-issuance-calculation-lines-table__col--pay" />
            <col className="payment-statement-issuance-calculation-lines-table__col--category" />
            <col className="payment-statement-issuance-calculation-lines-table__col--item" />
            <col className="payment-statement-issuance-calculation-lines-table__col--amount" />
          </colgroup>
          <thead>
            <tr>
              <th>참여 기관명</th>
              <th>강의 진행 일자</th>
              <th>지급/공제</th>
              <th>구분</th>
              <th>항목명</th>
              <th>금액</th>
            </tr>
          </thead>
          <tbody>
            {tableRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="payment-statement-issuance-calculation-lines-table__empty">
                  -
                </td>
              </tr>
            ) : (
              tableRows.map(row => (
                <tr key={row.key}>
                  {row.isFirstInBlock ? (
                    <>
                      <td rowSpan={row.blockRowSpan}>{row.institutionName}</td>
                      <td rowSpan={row.blockRowSpan}>
                        <div className="payment-statement-issuance-calculation-lines-table__date-cell">
                          {withProgramDetailTdDivider([
                            row.lectureDateDisplay,
                            row.lectureSessionDisplay,
                          ])}
                        </div>
                      </td>
                    </>
                  ) : null}
                  <td>{row.paymentDeductionLabel}</td>
                  <td>{row.categoryLabel}</td>
                  <td>{row.itemLabel}</td>
                  <td className="payment-statement-issuance-calculation-lines-table__amount">
                    {renderAmountText(row.amount, row)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr className="payment-statement-issuance-calculation-lines-table__summary-row">
              <th scope="row">합계</th>
              <td colSpan={4} className="payment-statement-issuance-calculation-lines-table__formula">
                {formulaLabel}
              </td>
              <td className="payment-statement-issuance-calculation-lines-table__summary-total">
                {formatPaymentOrderCalculationWonPlain(totalAmount)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
