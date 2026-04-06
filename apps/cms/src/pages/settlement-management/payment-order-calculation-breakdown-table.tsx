/**
 * 지급조서 산출 내역서 · 계좌 지급 현황 상세 등 — 산출 내역 상세 테이블 공통
 */

import { useMemo, type ReactNode } from 'react'
import { Table, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { DownloadOutlined } from '@ant-design/icons'
import { AppButton } from '@/shared/ui/app-button'
import { withProgramDetailTdDivider } from '@/features/program/ui/program-detail-td-divider'
import type { PaymentOrderCalculationStatementSessionBlock } from '@/data/mock/payment-order-admin-list'
import './payment-order-program-calculation-statement-modal.css'

export const PAYMENT_ORDER_CALC_BREAKDOWN_MIN_WIDTH = 1200

export interface PaymentOrderCalculationTableRow {
  key: string
  blockRowSpan: number
  isFirstInBlock: boolean
  institutionName: string
  lectureDateDisplay: string
  lectureSessionDisplay: string
  itemLabel: string
  description: string
  amount: number
  lineId: string
  amountDisplayOverride?: string
}

export function buildPaymentOrderCalculationTableRows(
  blocks: PaymentOrderCalculationStatementSessionBlock[]
): PaymentOrderCalculationTableRow[] {
  const out: PaymentOrderCalculationTableRow[] = []
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

function formatSignedWon(n: number): string {
  const sign = n >= 0 ? '+' : ''
  return `${sign}${n.toLocaleString('ko-KR')}원`
}

export function formatPaymentOrderCalculationWonPlain(n: number): string {
  return `${n.toLocaleString('ko-KR')}원`
}

export function getPaymentOrderCalculationColumns(options?: {
  onDetailClick?: () => void
}): ColumnsType<PaymentOrderCalculationTableRow> {
  const onDetailClick =
    options?.onDetailClick ?? (() => message.info('산정 기준 상세는 추후 연결됩니다.'))

  return [
    {
      title: '참여 기관명',
      dataIndex: 'institutionName',
      key: 'institutionName',
      width: 160,
      align: 'center',
      onCell: (record: PaymentOrderCalculationTableRow) => ({
        rowSpan: record.isFirstInBlock ? record.blockRowSpan : 0,
      }),
    },
    {
      title: '강의 진행 일자',
      key: 'lectureProgress',
      width: 268,
      align: 'center',
      onCell: (record: PaymentOrderCalculationTableRow) => ({
        rowSpan: record.isFirstInBlock ? record.blockRowSpan : 0,
      }),
      render: (_: unknown, row: PaymentOrderCalculationTableRow) => (
        <div className="payment-order-calc-statement-modal__td-divider-wrap payment-order-calc-statement-modal__td-divider-wrap--center">
          {withProgramDetailTdDivider([row.lectureDateDisplay, row.lectureSessionDisplay])}
        </div>
      ),
    },
    {
      title: '산정 항목',
      dataIndex: 'itemLabel',
      key: 'itemLabel',
      width: 120,
      align: 'center',
    },
    {
      title: '항목 설명',
      dataIndex: 'description',
      key: 'description',
      width: 320,
      ellipsis: { showTitle: true },
      align: 'center',
    },
    {
      title: '정산 금액',
      dataIndex: 'amount',
      key: 'amount',
      width: 152,
      align: 'center',
      render: (amount: number, row: PaymentOrderCalculationTableRow) =>
        row.amountDisplayOverride ? (
          <span className="payment-order-calc-statement-modal__amount--negative">
            {row.amountDisplayOverride}
          </span>
        ) : (
          <span
            className={
              amount >= 0
                ? 'payment-order-calc-statement-modal__amount--positive'
                : 'payment-order-calc-statement-modal__amount--negative'
            }
          >
            {formatSignedWon(amount)}
          </span>
        ),
    },
    {
      title: '산정 기준 상세',
      key: 'detail',
      width: 176,
      align: 'center',
      render: () => (
        <div className="payment-order-calc-statement-modal__detail-btn-wrap">
          <AppButton
            variant="default"
            className="payment-order-calc-statement-modal__detail-btn"
            onClick={onDetailClick}
          >
            상세 보기
          </AppButton>
        </div>
      ),
    },
  ]
}

export interface PaymentOrderCalculationBreakdownTableProps {
  blocks: PaymentOrderCalculationStatementSessionBlock[]
  formulaLabel: string
  totalAmount: number
  /** 산출 내역 헤더 우측 (예: 신청 반려/확인 처리, 지급 완료 처리) */
  headerActions?: ReactNode
  onDownloadPaymentStatement?: () => void
}

export function PaymentOrderCalculationBreakdownTable({
  blocks,
  formulaLabel,
  totalAmount,
  headerActions,
  onDownloadPaymentStatement,
}: PaymentOrderCalculationBreakdownTableProps) {
  const tableRows = useMemo(() => buildPaymentOrderCalculationTableRows(blocks), [blocks])
  const columns = useMemo(() => getPaymentOrderCalculationColumns(), [])

  const handleDownload =
    onDownloadPaymentStatement ?? (() => message.info('지급조서 다운로드는 추후 연결됩니다.'))

  return (
    <div
      className="payment-order-calc-statement-modal__detail-section"
      style={{ minWidth: PAYMENT_ORDER_CALC_BREAKDOWN_MIN_WIDTH }}
    >
      <div className="payment-order-calc-statement-modal__detail-header">
        <div className="payment-order-calc-statement-modal__detail-header-left">
          <div className="payment-order-calc-statement-modal__detail-title-row">
            <h3 className="payment-order-calc-statement-modal__section-title payment-order-calc-statement-modal__section-title--detail-inline">
              산출 내역 상세
            </h3>
            <p className="payment-order-calc-statement-modal__detail-desc">
              교통비 및 숙소비는 강사가 지급 신청한 경우에만 항목 노출됩니다.
            </p>
          </div>
        </div>
        {headerActions ? (
          <div className="payment-order-calc-statement-modal__detail-actions">{headerActions}</div>
        ) : null}
      </div>

      <Table<PaymentOrderCalculationTableRow>
        className="payment-order-calc-statement-modal__table participating-institutions-section__table"
        rowKey="key"
        columns={columns}
        dataSource={tableRows}
        pagination={false}
        size="middle"
        tableLayout="fixed"
        rowHoverable={false}
        scroll={{ x: PAYMENT_ORDER_CALC_BREAKDOWN_MIN_WIDTH }}
        summary={() => (
          <Table.Summary fixed="bottom">
            <Table.Summary.Row className="payment-order-calc-statement-modal__summary-row">
              <Table.Summary.Cell index={0} colSpan={2} align="center">
                <span className="payment-order-calc-statement-modal__summary-label">합계</span>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={2} colSpan={2} align="center">
                <span className="payment-order-calc-statement-modal__summary-formula">
                  {formulaLabel}
                </span>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={4} align="center">
                <span className="payment-order-calc-statement-modal__summary-total">
                  {formatPaymentOrderCalculationWonPlain(totalAmount)}
                </span>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={5} align="center">
                <AppButton
                  variant="primary"
                  icon={<DownloadOutlined />}
                  modalTeal
                  className="payment-order-calc-statement-modal__download-btn"
                  onClick={handleDownload}
                >
                  지급조서 다운로드
                </AppButton>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          </Table.Summary>
        )}
      />
    </div>
  )
}
