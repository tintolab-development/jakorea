/**
 * 지급조서 산출 내역서 · 계좌 지급 현황 상세 등 — 산출 내역 상세 테이블 공통
 */

import { useMemo, type ReactNode } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { DownloadOutlined } from '@ant-design/icons'
import { CmsButton } from '@/shared/ui/cms-button'
import { withProgramDetailTdDivider } from '@/features/program/shared/ui/program-detail-td-divider'
import type {
  PaymentOrderAdminLineProcessingStatus,
  PaymentOrderCalculationLineKind,
  PaymentOrderCalculationStatementSessionBlock,
} from '@/data/mock/payment-order-admin-list'
import type { PaymentOrderCalculationBasisDetail } from './payment-order-calculation-basis-detail'
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
  kind: PaymentOrderCalculationLineKind
  basisDetail?: PaymentOrderCalculationBasisDetail
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
        kind: line.kind,
        basisDetail: line.basisDetail,
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

function formatLectureSessionSegment(
  raw: string,
  mode: 'session' | 'round' | undefined
): string {
  if (mode === 'round') {
    return raw.replace(/차시/g, '회차')
  }
  return raw
}

export function getPaymentOrderCalculationColumns(options?: {
  onBasisDetailClick?: (row: PaymentOrderCalculationTableRow) => void
  /** @deprecated use onBasisDetailClick */
  onDetailClick?: () => void
  /** 강의 진행 일자 열의 세션 구간: `round`이면 차시 → 회차 (계좌 지급 현황 상세 등) */
  lectureSessionSegmentLabel?: 'session' | 'round'
}): ColumnsType<PaymentOrderCalculationTableRow> {
  const handleBasisDetailClick = (row: PaymentOrderCalculationTableRow) => {
    if (options?.onBasisDetailClick) {
      options.onBasisDetailClick(row)
      return
    }
    options?.onDetailClick?.()
    window.alert('준비 중입니다.')
  }

  const sessionLabelMode = options?.lectureSessionSegmentLabel ?? 'session'

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
          {withProgramDetailTdDivider([
            row.lectureDateDisplay,
            formatLectureSessionSegment(row.lectureSessionDisplay, sessionLabelMode),
          ])}
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
      render: (_: unknown, row: PaymentOrderCalculationTableRow) => (
        <div className="payment-order-calc-statement-modal__detail-btn-wrap">
          <CmsButton
            variant="default"
            style={{ width: '160px' }}
            size="large"
            onClick={() => handleBasisDetailClick(row)}
          >
            상세 보기
          </CmsButton>
        </div>
      ),
    },
  ]
}

export interface PaymentOrderCalculationBreakdownTableProps {
  blocks: PaymentOrderCalculationStatementSessionBlock[]
  formulaLabel: string
  totalAmount: number
  /**
   * 지급조서 처리 현황(라인/기본정보 클래스). `confirmed`(지급조서 확인 완료)이면 headerActions 미노출.
   * 미전달 시 headerActions 는 항상 표시(예: 계좌 지급 상세의 「지급 완료 처리」만 쓰는 경우).
   */
  processingStatus?: PaymentOrderAdminLineProcessingStatus
  /** 산출 내역 헤더 우측 (예: 신청 반려/확인 처리, 지급 완료 처리) */
  headerActions?: ReactNode
  onDownloadPaymentStatement?: () => void
  /**
   * 지급조서 발급 비활성(확인 완료·계좌 지급 완료 외).
   * 미전달 시 버튼 활성 — 호출부에서 조건 검증.
   */
  paymentStatementIssueDisabled?: boolean
  /** 계좌 지급 현황 상세 등: 산출 내역 강의 진행 일자 열에서 차시 대신 회차 표기 */
  lectureSessionSegmentLabel?: 'session' | 'round'
  /** 산정 기준 상세 모달 열기 */
  onBasisDetailClick?: (row: PaymentOrderCalculationTableRow) => void
}

export function PaymentOrderCalculationBreakdownTable({
  blocks,
  formulaLabel,
  totalAmount,
  processingStatus,
  headerActions,
  onDownloadPaymentStatement,
  paymentStatementIssueDisabled = false,
  lectureSessionSegmentLabel = 'session',
  onBasisDetailClick,
}: PaymentOrderCalculationBreakdownTableProps) {
  const tableRows = useMemo(() => buildPaymentOrderCalculationTableRows(blocks), [blocks])
  const columns = useMemo(
    () => getPaymentOrderCalculationColumns({ lectureSessionSegmentLabel, onBasisDetailClick }),
    [lectureSessionSegmentLabel, onBasisDetailClick]
  )
  const hideHeaderActionsStatuses: PaymentOrderAdminLineProcessingStatus[] = [
    'confirmed',
    'application_rejected',
    'rejected',
  ]
  const showHeaderActions =
    headerActions != null &&
    (processingStatus === undefined || !hideHeaderActionsStatuses.includes(processingStatus))

  const handleDownload = () => {
    if (paymentStatementIssueDisabled) return
    if (onDownloadPaymentStatement) {
      onDownloadPaymentStatement()
      return
    }
    window.alert('준비 중입니다.')
  }

  return (
    <div
      className="payment-order-calc-statement-modal__detail-section"
      style={{ minWidth: PAYMENT_ORDER_CALC_BREAKDOWN_MIN_WIDTH }}
    >
      <div className="payment-order-calc-statement-modal__detail-header">
        <div className="payment-order-calc-statement-modal__detail-header-left">
          <div>
            <span className="info-section-title">산출 내역 상세</span>
            <span className="info-section-desc">
              교통비 및 숙소비는 강사가 지급 신청한 경우에만 항목 노출됩니다.
            </span>
          </div>
        </div>
        {showHeaderActions ? (
          <div className="payment-order-calc-statement-modal__detail-actions">{headerActions}</div>
        ) : null}
      </div>

      <Table<PaymentOrderCalculationTableRow>
        className="payment-order-calc-statement-modal__table cms-data-table cms-data-table--skip-auto-no-col"
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
                <CmsButton
                  variant="primary"
                  size="large"
                  style={{ width: '160px' }}
                  icon={<DownloadOutlined />}
                  disabled={paymentStatementIssueDisabled}
                  title={
                    paymentStatementIssueDisabled
                      ? '지급조서 확인 완료 또는 계좌 지급 완료 건만 발급할 수 있습니다.'
                      : undefined
                  }
                  onClick={handleDownload}
                >
                  지급조서 발급
                </CmsButton>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          </Table.Summary>
        )}
      />
    </div>
  )
}
