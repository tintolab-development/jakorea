/**
 * 지급조서(발급용) — 「강사비 산출 내역」표.
 * Ant Design Table(scroll/sticky)은 A4 미리보기에서 보더·레이아웃이 깨지므로
 * 편집·미리보기 동일하게 네이티브 HTML 테이블로 렌더한다.
 */

import { useMemo, type ReactNode } from 'react'
import type {
  PaymentOrderCalculationLineKind,
  PaymentOrderCalculationStatementSessionBlock,
} from '@/features/settlement-management/model/payment-order-admin-list'
import { withProgramDetailTdDivider } from '@/features/program/shared/ui/program-detail-td-divider'
import { resolvePaymentStatementIssuanceCategoryLabel } from './payment-statement-issuance-category-label'
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
  /** 산출 내역서(관리자) — 「항목 설명」열 */
  description: string
  amount: number
  lineId: string
  amountDisplayOverride?: string
}

/** 산출 내역서 표와 같은 금액 표기 (`n원`) — breakdown-table과 순환 import를 피하려 로컬 정의 */
function formatPaymentOrderCalculationWonPlain(n: number): string {
  return `${n.toLocaleString('ko-KR')}원`
}

function paymentDeductionLabel(kind: PaymentOrderCalculationLineKind): string {
  return kind === 'withholding' ? '공제' : '지급'
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
        categoryLabel: resolvePaymentStatementIssuanceCategoryLabel(line),
        itemLabel: line.itemLabel,
        description: line.description,
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
  /** 개인형 프로그램 — 「참여 기관명」열 미노출 */
  hideInstitutionColumn?: boolean
  /** `description`: 산출 내역서 — 5열을 「항목 설명」(행 description)으로 표시 */
  itemColumn?: 'itemLabel' | 'description'
  /** 산출 내역서 — 맨 오른쪽 추가 열 (예: 산정 기준 상세) */
  trailingColumn?: {
    title: ReactNode
    renderCell: (row: PaymentStatementIssuanceCalculationLinesRow) => ReactNode
    /** 합계 행의 같은 열 (예: 지급조서 발급 버튼) */
    summaryCell?: ReactNode
  }
  className?: string
}

export function PaymentStatementIssuanceCalculationLinesTable({
  blocks,
  formulaLabel,
  totalAmount,
  hideInstitutionColumn = false,
  itemColumn = 'itemLabel',
  trailingColumn,
  className,
}: PaymentStatementIssuanceCalculationLinesTableProps) {
  const columnCount = (hideInstitutionColumn ? 5 : 6) + (trailingColumn ? 1 : 0)
  const tableRows = useMemo(
    () => buildPaymentStatementIssuanceCalculationLinesRows(blocks),
    [blocks]
  )

  const rootClass = [
    'payment-statement-issuance-calculation-lines-table',
    hideInstitutionColumn ? 'payment-statement-issuance-calculation-lines-table--no-institution' : '',
    trailingColumn ? 'payment-statement-issuance-calculation-lines-table--with-trailing' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="payment-statement-issuance-calculation-lines-table__wrap">
      <div className="payment-statement-issuance-calculation-lines-table__radius">
        <table className={rootClass}>
          <colgroup>
            {hideInstitutionColumn ? null : (
              <col className="payment-statement-issuance-calculation-lines-table__col--institution" />
            )}
            <col className="payment-statement-issuance-calculation-lines-table__col--date" />
            <col className="payment-statement-issuance-calculation-lines-table__col--pay" />
            <col className="payment-statement-issuance-calculation-lines-table__col--category" />
            <col className="payment-statement-issuance-calculation-lines-table__col--item" />
            <col className="payment-statement-issuance-calculation-lines-table__col--amount" />
            {trailingColumn ? (
              <col className="payment-statement-issuance-calculation-lines-table__col--trailing" />
            ) : null}
          </colgroup>
          <thead>
            <tr>
              {hideInstitutionColumn ? null : <th>참여 기관명</th>}
              <th>강의 진행 일자</th>
              <th>지급/공제</th>
              <th>구분</th>
              <th>{itemColumn === 'description' ? '항목 설명' : '항목명'}</th>
              <th>금액</th>
              {trailingColumn ? <th>{trailingColumn.title}</th> : null}
            </tr>
          </thead>
          <tbody>
            {tableRows.length === 0 ? (
              <tr>
                <td
                  colSpan={columnCount}
                  className="payment-statement-issuance-calculation-lines-table__empty"
                >
                  -
                </td>
              </tr>
            ) : (
              tableRows.map(row => (
                <tr key={row.key}>
                  {row.isFirstInBlock ? (
                    <>
                      {hideInstitutionColumn ? null : (
                        <td rowSpan={row.blockRowSpan}>{row.institutionName}</td>
                      )}
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
                  <td>{itemColumn === 'description' ? row.description : row.itemLabel}</td>
                  <td className="payment-statement-issuance-calculation-lines-table__amount">
                    {renderAmountText(row.amount, row)}
                  </td>
                  {trailingColumn ? <td>{trailingColumn.renderCell(row)}</td> : null}
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr className="payment-statement-issuance-calculation-lines-table__summary-row">
              <th scope="row">합계</th>
              <td
                colSpan={columnCount - 2 - (trailingColumn ? 1 : 0)}
                className="payment-statement-issuance-calculation-lines-table__formula"
              >
                {formulaLabel}
              </td>
              <td className="payment-statement-issuance-calculation-lines-table__summary-total">
                {formatPaymentOrderCalculationWonPlain(totalAmount)}
              </td>
              {trailingColumn ? <td>{trailingColumn.summaryCell ?? null}</td> : null}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
