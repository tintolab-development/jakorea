/**
 * 지급조서(발급용) — 「강의비 산출 내역」Ant Design 테이블.
 * 정산 `PaymentOrderCalculationBreakdownTable`와 동일 스타일 클래스를 공유하되, 열 구성은 발급 시안(6열, 산정 기준·발급 버튼 없음).
 */

import { useMemo } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type {
  PaymentOrderCalculationLineKind,
  PaymentOrderCalculationStatementSessionBlock,
} from '@/data/mock/payment-order-admin-list'
import { withProgramDetailTdDivider } from '@/features/program/shared/ui/program-detail-td-divider'
import {
  formatPaymentOrderCalculationWonPlain,
} from '@/features/settlement/ui/payment-record/payment-order-calculation-breakdown-table'
import '@/features/settlement/ui/payment-record/payment-order-program-calculation-statement-modal.css'
import './payment-statement-issuance-calculation-lines-table.css'


export const PAYMENT_STATEMENT_ISSUANCE_CALC_LINES_MIN_WIDTH = 1020

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

function categoryLabel(kind: PaymentOrderCalculationLineKind): string {
  switch (kind) {
    case 'lecture_fee':
      return '3급'
    case 'travel':
      return '일반'
    case 'lodging':
      return '고정급'
    case 'meal':
      return '일반'
    case 'activity':
      return '일반'
    case 'withholding':
      return '일반'
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

function renderAmountCell(amount: number, row: PaymentStatementIssuanceCalculationLinesRow) {
  if (row.amountDisplayOverride) {
    return (
      <span className="payment-order-calc-statement-modal__amount--negative">
        {row.amountDisplayOverride}
      </span>
    )
  }
  return (
    <span className="payment-order-calc-statement-modal__amount--positive">
      {formatPaymentOrderCalculationWonPlain(amount)}
    </span>
  )
}

function getIssuanceCalculationLinesColumns(): ColumnsType<PaymentStatementIssuanceCalculationLinesRow> {
  return [
    {
      title: '참여 기관명',
      dataIndex: 'institutionName',
      key: 'institutionName',
      width: 160,
      align: 'center',
      onCell: record => ({
        rowSpan: record.isFirstInBlock ? record.blockRowSpan : 0,
      }),
    },
    {
      title: '강의 진행 일자',
      key: 'lectureProgress',
      width: 268,
      align: 'center',
      onCell: record => ({
        rowSpan: record.isFirstInBlock ? record.blockRowSpan : 0,
      }),
      render: (_: unknown, row: PaymentStatementIssuanceCalculationLinesRow) => (
        <div className="payment-order-calc-statement-modal__td-divider-wrap payment-order-calc-statement-modal__td-divider-wrap--center">
          {withProgramDetailTdDivider([row.lectureDateDisplay, row.lectureSessionDisplay])}
        </div>
      ),
    },
    {
      title: '지급/공제',
      dataIndex: 'paymentDeductionLabel',
      key: 'paymentDeductionLabel',
      width: 112,
      align: 'center',
    },
    {
      title: '구분',
      dataIndex: 'categoryLabel',
      key: 'categoryLabel',
      width: 112,
      align: 'center',
    },
    {
      title: '항목명',
      dataIndex: 'itemLabel',
      key: 'itemLabel',
      width: 200,
      ellipsis: { showTitle: true },
      align: 'center',
    },
    {
      title: '금액',
      dataIndex: 'amount',
      key: 'amount',
      width: 168,
      align: 'center',
      render: (amount: number, row: PaymentStatementIssuanceCalculationLinesRow) =>
        renderAmountCell(amount, row),
    },
  ]
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
  const columns = useMemo(() => getIssuanceCalculationLinesColumns(), [])

  const rootClass = [
    'payment-statement-issuance-calculation-lines-table',
    'payment-order-calc-statement-modal__table',
    'cms-data-table',
    'cms-data-table--skip-auto-no-col',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className="payment-statement-issuance-calculation-lines-table__wrap"
      style={{ minWidth: PAYMENT_STATEMENT_ISSUANCE_CALC_LINES_MIN_WIDTH }}
    >
      <Table<PaymentStatementIssuanceCalculationLinesRow>
        className={rootClass}
        rowKey="key"
        columns={columns}
        dataSource={tableRows}
        pagination={false}
        size="middle"
        tableLayout="fixed"
        rowHoverable={false}
        scroll={{ x: PAYMENT_STATEMENT_ISSUANCE_CALC_LINES_MIN_WIDTH }}
        summary={() => (
          <Table.Summary fixed="bottom">
            <Table.Summary.Row className="payment-order-calc-statement-modal__summary-row">
              <Table.Summary.Cell index={0} colSpan={1} align="center">
                <span className="payment-order-calc-statement-modal__summary-label">합계</span>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={1} colSpan={4} align="center">
                <span className="payment-order-calc-statement-modal__summary-formula">
                  {formulaLabel}
                </span>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={2} align="center">
                <span className="payment-order-calc-statement-modal__summary-total">
                  {formatPaymentOrderCalculationWonPlain(totalAmount)}
                </span>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          </Table.Summary>
        )}
      />
    </div>
  )
}
