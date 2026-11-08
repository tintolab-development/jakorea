/**
 * 지급조서 산출 내역서 · 계좌 지급 현황 상세 등 — 산출 내역 상세 테이블 공통
 */

import { useMemo, useState, type ReactNode } from 'react'
import type { ColumnsType } from 'antd/es/table'
import { CmsButton, type CmsButtonSize } from '@/shared/ui/cms-button'
import { CalculationDetailViewButton } from './calculation-detail-view-button'
import { PaymentStatementIssuanceCalculationLinesTable } from '@/features/template/ui/form-set/detail-forms/payment-statement-issuance-calculation-lines-table'
import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'
import { CMS_ALERT_MODAL_Z_INDEX } from '@/shared/constants/modal-z-index'
import { InstructorPaymentStatementBlockedModal } from '@/features/user/detail/ui/modal/instructor-payment-statement-blocked-modal'
import { withProgramDetailTdDivider } from '@/features/program/shared/ui/program-detail-td-divider'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import type {
  PaymentOrderCalculationLineKind,
  PaymentOrderCalculationStatementSessionBlock,
} from '@/features/settlement-management/model/payment-order-admin-list'
import type { PaymentOrderCalculationBasisDetail } from './payment-order-calculation-basis-detail'
import { ButtonDownloadIcon } from '@/shared/ui/icons/ButtonIcons'
import './payment-order-program-calculation-statement-modal.css'

export const PAYMENT_ORDER_CALC_BREAKDOWN_MIN_WIDTH = 1200
/** 산출 내역서 Figma w1400 콘텐츠 폭: 1400 - 좌우 30px */
export const PAYMENT_ORDER_CALC_STATEMENT_MIN_WIDTH = 1340

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

/** 지급 `+`, 공제 `-`, 0원은 부호 없이 `0원` */
function formatSignedWon(n: number): string {
  const sign = n > 0 ? '+' : ''
  return `${sign}${n.toLocaleString('ko-KR')}원`
}

export function formatPaymentOrderCalculationWonPlain(n: number): string {
  return `${n.toLocaleString('ko-KR')}원`
}

function formatLectureSessionSegment(raw: string, _mode: 'session' | 'round' | undefined): string {
  return raw
}

export function getPaymentOrderCalculationColumns(options?: {
  onBasisDetailClick?: (row: PaymentOrderCalculationTableRow) => void
  /** @deprecated use onBasisDetailClick */
  onDetailClick?: () => void
  /** 강의 진행 일자 열의 세션 구간: `round`이면 차시 → 회차 (계좌 지급 현황 상세 등) */
  lectureSessionSegmentLabel?: 'session' | 'round'
  /** 산출 내역서(1340px) · 계좌 지급 현황 상세 · compact */
  columnWidthPreset?: 'statement-modal' | 'compact' | 'account-payment-detail'
  /** 1열 헤더. 기본 참여 기관명 */
  institutionColumnTitle?: string
  /** 2열 헤더. 기본 교육 진행 일자 */
  dateColumnTitle?: string
  /** true면 항목 설명 말줄임 대신 개행 */
  wrapDescription?: boolean
  /** 개인형 프로그램 — 1열(참여 기관명/프로그램명) 미노출 */
  hideInstitutionColumn?: boolean
}): ColumnsType<PaymentOrderCalculationTableRow> {
  const handleBasisDetailClick = (row: PaymentOrderCalculationTableRow) => {
    if (options?.onBasisDetailClick) {
      options.onBasisDetailClick(row)
      return
    }
    if (options?.onDetailClick) {
      options.onDetailClick()
      return
    }
    cmsAlertModal.show({
      title: '안내',
      content: '산정 기준 상세를 표시할 수 없습니다.',
    })
  }

  const sessionLabelMode = options?.lectureSessionSegmentLabel ?? 'session'
  const columnWidthPreset = options?.columnWidthPreset ?? 'statement-modal'
  const columnWidths =
    columnWidthPreset === 'account-payment-detail'
      ? {
          institution: 180,
          date: 260,
          item: 140,
          description: undefined,
          amount: 180,
          detail: 200,
        }
      : columnWidthPreset === 'statement-modal'
        ? { institution: 188, date: 264, item: 142, description: 311, amount: 214, detail: 221 }
        : { institution: 160, date: 268, item: 120, description: 320, amount: 152, detail: 176 }

  const columns: ColumnsType<PaymentOrderCalculationTableRow> = [
    {
      title: options?.institutionColumnTitle ?? '참여 기관명',
      dataIndex: 'institutionName',
      key: 'institutionName',
      width: columnWidths.institution,
      align: 'center',
      onCell: (record: PaymentOrderCalculationTableRow) => ({
        rowSpan: record.isFirstInBlock ? record.blockRowSpan : 0,
      }),
    },
    {
      title: options?.dateColumnTitle ?? '교육 진행 일자',
      key: 'lectureProgress',
      width: columnWidths.date,
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
      width: columnWidths.item,
      align: 'center',
    },
    {
      title: '항목 설명',
      dataIndex: 'description',
      key: 'description',
      width: columnWidths.description,
      ellipsis: options?.wrapDescription ? false : { showTitle: true },
      align: 'center',
      onCell: options?.wrapDescription
        ? () => ({ className: 'payment-order-calc-statement-modal__description-cell' })
        : undefined,
    },
    {
      title: '정산 금액',
      dataIndex: 'amount',
      key: 'amount',
      width: columnWidths.amount,
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
      width: columnWidths.detail,
      align: 'center',
      render: (_: unknown, row: PaymentOrderCalculationTableRow) => (
        <div className="payment-order-calc-statement-modal__detail-btn-wrap">
          <CalculationDetailViewButton onClick={() => handleBasisDetailClick(row)} />
        </div>
      ),
    },
  ]
  return options?.hideInstitutionColumn
    ? columns.filter(column => column.key !== 'institutionName')
    : columns
}

export interface PaymentOrderCalculationBreakdownTableProps {
  blocks: PaymentOrderCalculationStatementSessionBlock[]
  formulaLabel: string
  totalAmount: number
  /** 산출 내역 헤더 우측 (예: 신청 반려/확인 처리, 지급 완료 처리) */
  headerActions?: ReactNode
  onDownloadPaymentStatement?: () => void
  /**
   * 지급조서 발급 불가(확인 완료·계좌 지급 완료 외).
   * true면 발급 클릭 시 `지급조서 발급 불가 안내` 모달.
   * 미전달 시 발급 진행 — 호출부에서 조건 검증.
   */
  paymentStatementIssueDisabled?: boolean
  /** 계좌 지급 현황 상세 등: 산출 내역 강의 진행 일자 열에서 차시 대신 회차 표기 */
  lectureSessionSegmentLabel?: 'session' | 'round'
  /** 산정 기준 상세 모달 열기 */
  onBasisDetailClick?: (row: PaymentOrderCalculationTableRow) => void
  /** 산출 내역 상세 제목 옆 안내 문구 */
  detailDescription?: string
  /** 산정 기준 상세 · 지급조서 발급 버튼 (기본 large) */
  actionButtonSize?: CmsButtonSize
  /** 산출 내역서(1340px) · 계좌 지급 현황 상세 · compact */
  columnWidthPreset?: 'statement-modal' | 'compact' | 'account-payment-detail'
  institutionColumnTitle?: string
  dateColumnTitle?: string
  /**
   * `cms-data-table`: 공유 테이블 패딩·타이포(8×12, 14px/150%).
   * `statement-modal`: 산출 내역서 모달 전용 오버라이드(기본).
   */
  tableCellSpec?: 'statement-modal' | 'cms-data-table'
  /**
   * `payment-statement`: 지급조서 내부 「강사비 산출 내역」표와 같은
   * 네이티브 표 스타일로 (참여 기관명 · 교육 진행 일자 · 산정 항목 · 항목 설명 · 정산 금액 + 산정 기준 상세).
   */
  layout?: 'data-table' | 'payment-statement'
  /** `payment-statement` — 기관 프로그램이 아니면 참여 기관명 열 미노출 */
  hideInstitutionColumn?: boolean
}

export function PaymentOrderCalculationBreakdownTable({
  blocks,
  formulaLabel,
  totalAmount,
  headerActions,
  onDownloadPaymentStatement,
  paymentStatementIssueDisabled = false,
  lectureSessionSegmentLabel = 'session',
  onBasisDetailClick,
  detailDescription,
  actionButtonSize = 'large',
  columnWidthPreset,
  institutionColumnTitle,
  dateColumnTitle,
  tableCellSpec = 'statement-modal',
  layout = 'data-table',
  hideInstitutionColumn = false,
}: PaymentOrderCalculationBreakdownTableProps) {
  const resolvedColumnWidthPreset =
    columnWidthPreset ?? (tableCellSpec === 'statement-modal' ? 'statement-modal' : 'compact')
  const isAccountPaymentDetail = resolvedColumnWidthPreset === 'account-payment-detail'
  const tableMinWidth = isAccountPaymentDetail
    ? 1200
    : tableCellSpec === 'statement-modal'
      ? PAYMENT_ORDER_CALC_STATEMENT_MIN_WIDTH
      : PAYMENT_ORDER_CALC_BREAKDOWN_MIN_WIDTH
  const tableClassName = isAccountPaymentDetail
    ? 'payment-order-calc-statement-modal__table cms-data-table cms-data-table--skip-auto-no-col account-payment-status-detail__calc-table'
    : tableCellSpec === 'cms-data-table'
      ? 'cms-data-table cms-data-table--skip-auto-no-col account-payment-status-detail__calc-table'
      : 'payment-order-calc-statement-modal__table cms-data-table cms-data-table--skip-auto-no-col'
  const wrapDescription = tableCellSpec === 'cms-data-table'
  const tableRows = useMemo(() => buildPaymentOrderCalculationTableRows(blocks), [blocks])
  const columns = useMemo(
    () =>
      getPaymentOrderCalculationColumns({
        lectureSessionSegmentLabel,
        onBasisDetailClick,
        columnWidthPreset: resolvedColumnWidthPreset,
        institutionColumnTitle,
        dateColumnTitle,
        wrapDescription,
        hideInstitutionColumn,
      }),
    [
      lectureSessionSegmentLabel,
      onBasisDetailClick,
      resolvedColumnWidthPreset,
      wrapDescription,
      institutionColumnTitle,
      dateColumnTitle,
      hideInstitutionColumn,
    ]
  )
  /** 1열을 숨기면 합계 행 셀 index가 한 칸씩 당겨진다 */
  const summaryOffset = hideInstitutionColumn ? -1 : 0
  const showHeaderActions = headerActions != null
  const [issueBlockedOpen, setIssueBlockedOpen] = useState(false)

  const handleDownload = () => {
    if (paymentStatementIssueDisabled) {
      setIssueBlockedOpen(true)
      return
    }
    if (onDownloadPaymentStatement) {
      onDownloadPaymentStatement()
      return
    }
    cmsAlertModal.show({
      title: '안내',
      content: '지급조서 발급 API가 이 화면에 연결되어 있지 않습니다.',
    })
  }

  return (
    <div
      className="payment-order-calc-statement-modal__detail-section"
      style={isAccountPaymentDetail ? undefined : { minWidth: tableMinWidth }}
    >
      <div className="payment-order-calc-statement-modal__detail-header">
        <div className="payment-order-calc-statement-modal__detail-header-left">
          <span className="info-section-title">산출 내역 상세</span>
          {detailDescription ? (
            <span className="payment-order-calc-statement-modal__detail-desc">
              {detailDescription}
            </span>
          ) : null}
        </div>
        {showHeaderActions ? (
          <div className="payment-order-calc-statement-modal__detail-actions">{headerActions}</div>
        ) : null}
      </div>

      {layout === 'payment-statement' ? (
        <PaymentStatementIssuanceCalculationLinesTable
          blocks={blocks}
          formulaLabel={formulaLabel}
          totalAmount={totalAmount}
          hideInstitutionColumn={hideInstitutionColumn}
          className="payment-order-calc-statement-modal__lines-table"
          columnPreset="calculation-statement"
          trailingColumn={{
            title: '산정 기준 상세',
            renderCell: row => {
              const tableRow = tableRows.find(r => r.lineId === row.lineId)
              return (
                <div className="payment-order-calc-statement-modal__detail-btn-wrap">
                  <CalculationDetailViewButton
                    onClick={() => {
                      if (tableRow && onBasisDetailClick) {
                        onBasisDetailClick(tableRow)
                        return
                      }
                      cmsAlertModal.show({
                        title: '안내',
                        content: '산정 기준 상세를 표시할 수 없습니다.',
                      })
                    }}
                  />
                </div>
              )
            },
            summaryCell: (
              <CmsButton
                type="button"
                variant="primary"
                size="h32"
                style={{ width: '100%' }}
                icon={<ButtonDownloadIcon />}
                onClick={handleDownload}
              >
                지급조서 발급
              </CmsButton>
            ),
          }}
        />
      ) : (
        <CmsDataTable<PaymentOrderCalculationTableRow>
          className={tableClassName}
          rowKey="key"
          columns={columns}
          dataSource={tableRows}
          pagination={false}
          size={tableCellSpec === 'cms-data-table' ? undefined : 'middle'}
          tableLayout="fixed"
          rowHoverable={false}
          scroll={{ x: tableMinWidth }}
          summary={() => (
            <CmsDataTable.Summary fixed="bottom">
              <CmsDataTable.Summary.Row className="payment-order-calc-statement-modal__summary-row">
                <CmsDataTable.Summary.Cell
                  index={0}
                  colSpan={hideInstitutionColumn ? 1 : 2}
                  align="center"
                >
                  <span className="payment-order-calc-statement-modal__summary-label">합계</span>
                </CmsDataTable.Summary.Cell>
                <CmsDataTable.Summary.Cell index={summaryOffset + 2} colSpan={2} align="center">
                  <span className="payment-order-calc-statement-modal__summary-formula">
                    {formulaLabel}
                  </span>
                </CmsDataTable.Summary.Cell>
                <CmsDataTable.Summary.Cell index={summaryOffset + 4} align="center">
                  <span className="payment-order-calc-statement-modal__summary-total">
                    {formatPaymentOrderCalculationWonPlain(totalAmount)}
                  </span>
                </CmsDataTable.Summary.Cell>
                <CmsDataTable.Summary.Cell index={summaryOffset + 5} align="center">
                  <CmsButton
                    type="button"
                    variant="primary"
                    size={actionButtonSize}
                    icon={<ButtonDownloadIcon />}
                    onClick={handleDownload}
                  >
                    지급조서 발급
                  </CmsButton>
                </CmsDataTable.Summary.Cell>
              </CmsDataTable.Summary.Row>
            </CmsDataTable.Summary>
          )}
        />
      )}
      <InstructorPaymentStatementBlockedModal
        open={issueBlockedOpen}
        onClose={() => setIssueBlockedOpen(false)}
        variant="single"
        layout="detailFullpage"
        zIndex={CMS_ALERT_MODAL_Z_INDEX}
      />
    </div>
  )
}
