/**
 * 정산 관리 > 지급 현황 상세(프로그램) — 산출 내역서 ContentModal
 */

import { useEffect, useMemo, useState } from 'react'
import { Table, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { DownloadOutlined } from '@ant-design/icons'
import { ContentModal } from '@/shared/ui/content-modal'
import { AppButton } from '@/shared/ui/app-button'
import { SendNotiButton } from '@/features/program/ui/detail-modal/components/send-noti-button'
import { withProgramDetailTdDivider } from '@/features/program/ui/program-detail-td-divider'
import type { PaymentOrderProgramCalculationStatement } from '@/data/mock/payment-order-admin-list'
import '@/features/program/ui/detail-modal/applicants/applicant-instructor-basic-info.css'
import '@/features/program/ui/detail-modal/project-info/project-info-form-shared.css'
import './payment-order-admin-status-tag.css'
import './payment-order-program-calculation-statement-modal.css'
import { PaymentOrderPaymentConfirmationModal } from './payment-order-payment-confirmation-modal'
import { PaymentOrderPaymentRejectionModal } from './payment-order-payment-rejection-modal'
import { PaymentOrderPaymentRejectionResultModal } from './payment-order-payment-rejection-result-modal'

/** 산출 내역 `Table`의 `scroll.x`와 동일 — 기본정보 블록 가로 폭을 하단 테이블과 맞춤 */
const CALC_STATEMENT_CONTENT_MIN_WIDTH = 1200

export interface PaymentOrderProgramCalculationStatementModalProps {
  open: boolean
  onCancel: () => void
  data: PaymentOrderProgramCalculationStatement | null
}

interface CalcTableRow {
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

function buildTableRows(
  blocks: PaymentOrderProgramCalculationStatement['blocks']
): CalcTableRow[] {
  const out: CalcTableRow[] = []
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

function formatWonPlain(n: number): string {
  return `${n.toLocaleString('ko-KR')}원`
}

export function PaymentOrderProgramCalculationStatementModal({
  open,
  onCancel,
  data,
}: PaymentOrderProgramCalculationStatementModalProps) {
  const [paymentConfirmOpen, setPaymentConfirmOpen] = useState(false)
  const [paymentRejectOpen, setPaymentRejectOpen] = useState(false)
  const [paymentRejectDoneOpen, setPaymentRejectDoneOpen] = useState(false)
  const [paymentRejectReason, setPaymentRejectReason] = useState('')

  useEffect(() => {
    if (!open) {
      setPaymentConfirmOpen(false)
      setPaymentRejectOpen(false)
      setPaymentRejectDoneOpen(false)
      setPaymentRejectReason('')
    }
  }, [open])

  const tableRows = useMemo(() => {
    if (!data) return []
    return buildTableRows(data.blocks)
  }, [data])

  const columns: ColumnsType<CalcTableRow> = useMemo(
    () => [
      {
        title: '참여 기관명',
        dataIndex: 'institutionName',
        key: 'institutionName',
        width: 160,
        align: 'center',
        onCell: (record: CalcTableRow) => ({
          rowSpan: record.isFirstInBlock ? record.blockRowSpan : 0,
        }),
      },
      {
        title: '강의 진행 일자',
        key: 'lectureProgress',
        width: 268,
        align: 'center',
        onCell: (record: CalcTableRow) => ({
          rowSpan: record.isFirstInBlock ? record.blockRowSpan : 0,
        }),
        render: (_: unknown, row: CalcTableRow) => (
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
        render: (amount: number, row: CalcTableRow) =>
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
        render: (_: unknown, _record: CalcTableRow) => (
          <div className="payment-order-calc-statement-modal__detail-btn-wrap">
            <AppButton
              variant="default"
              className="payment-order-calc-statement-modal__detail-btn"
              onClick={() => message.info('산정 기준 상세는 추후 연결됩니다.')}
            >
              상세 보기
            </AppButton>
          </div>
        ),
      },
    ],
    []
  )

  if (!data) {
    return null
  }

  const { formulaLabel } = data

  return (
    <>
    <ContentModal
      open={open}
      onCancel={onCancel}
      title="산출 내역서"
      size="large"
      width={1400}
      className="payment-order-calc-statement-modal"
      footer={
        <AppButton variant="cancel" size="large" onClick={onCancel}>
          닫기
        </AppButton>
      }
    >
      {data.context === 'program' ? (
        <div
          className="payment-order-calc-statement-modal__basic payment-order-calc-statement-modal__basic--program-info"
          style={{ minWidth: CALC_STATEMENT_CONTENT_MIN_WIDTH }}
        >
          <h3 className="program-detail-info-tab__section-title payment-order-calc-statement-modal__basic-info-title">
            기본 정보
          </h3>
          <div className="program-detail-info-tab__table-wrapper program-detail-info-tab__table-wrapper--top">
            <table className="program-detail-info-tab__table program-detail-info-tab__table--basic">
              <colgroup>
                <col style={{ width: '200px' }} />
                <col />
                <col style={{ width: '200px' }} />
                <col />
              </colgroup>
              <tbody>
                <tr>
                  <th scope="row">프로그램명</th>
                  <td>{data.basic.programName}</td>
                  <th scope="row">사업 운영 기간</th>
                  <td>{data.basic.businessPeriodDisplay}</td>
                </tr>
                <tr>
                  <th scope="row">프로그램 진행 회차</th>
                  <td>{data.basic.programSessionProgressDisplay}</td>
                  <th scope="row">지급 조서 처리 현황</th>
                  <td>
                    {data.basic.processingStatusClass === 'rejected' ? (
                      <div className="payment-order-calc-statement-modal__processing-status-row">
                        <span
                          className={`payment-order-admin__status-text payment-order-admin__status-text--${data.basic.processingStatusClass}`}
                        >
                          {data.basic.processingStatusDisplay}
                        </span>
                        <span
                          className="payment-order-calc-statement-modal__processing-vbar"
                          aria-hidden="true"
                        />
                        <span className="payment-order-calc-statement-modal__processing-reason">
                          사유 : {data.basic.processingRejectionReason ?? '-'}
                        </span>
                        <span
                          className="payment-order-calc-statement-modal__processing-vbar"
                          aria-hidden="true"
                        />
                        <SendNotiButton
                          onClick={() => message.info('알림 발송은 추후 연결됩니다.')}
                        />
                      </div>
                    ) : (
                      <span
                        className={`payment-order-admin__status-text payment-order-admin__status-text--${data.basic.processingStatusClass}`}
                      >
                        {data.basic.processingStatusDisplay}
                      </span>
                    )}
                  </td>
                </tr>
                <tr>
                  <th scope="row">강의비 책정 기준</th>
                  <td>
                    <div className="payment-order-calc-statement-modal__td-divider-wrap payment-order-calc-statement-modal__td-divider-wrap--start">
                      {withProgramDetailTdDivider([
                        data.basic.lectureFeeStandardTitle,
                        data.basic.lectureFeeStandardAmount,
                      ])}
                    </div>
                  </td>
                  <th scope="row">사업소득자 여부</th>
                  <td>{data.basic.businessIncomeEarnerLabel}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div
          className="payment-order-calc-statement-modal__basic payment-order-calc-statement-modal__basic--instructor"
          style={{ minWidth: CALC_STATEMENT_CONTENT_MIN_WIDTH }}
        >
          <h3 className="payment-order-calc-statement-modal__section-title">기본 정보</h3>
          <div className="applicant-instructor-basic-info__table-wrap payment-order-calc-statement-modal__basic-applicant-wrap">
            <table className="applicant-instructor-basic-info__table">
              <colgroup>
                <col style={{ width: '140px' }} />
                <col style={{ width: '80px' }} />
                <col />
                <col style={{ width: '160px' }} />
                <col />
              </colgroup>
              <tbody>
                <tr>
                  <td
                    rowSpan={2}
                    className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--label applicant-instructor-basic-info__cell--name"
                  >
                    성명
                  </td>
                  <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--label">
                    한글
                  </td>
                  <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--value">
                    {data.basic.nameKo}
                  </td>
                  <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--label">
                    연락처
                  </td>
                  <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--value">
                    {data.basic.phoneDisplay}
                  </td>
                </tr>
                <tr>
                  <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--label">
                    영문
                  </td>
                  <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--value">
                    {data.basic.nameEn}
                  </td>
                  <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--label">
                    이메일
                  </td>
                  <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--value">
                    {data.basic.emailDisplay}
                  </td>
                </tr>
                <tr>
                  <td
                    colSpan={2}
                    className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--label"
                  >
                    자택 주소
                  </td>
                  <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--value">
                    {data.basic.addressBlurredTail ? (
                      <>
                        {data.basic.addressDisplay}
                        <span
                          className="applicant-instructor-basic-info__address-blur"
                          aria-hidden="true"
                        >
                          {' '}
                          {data.basic.addressBlurredTail}
                        </span>
                      </>
                    ) : (
                      data.basic.addressDisplay
                    )}
                  </td>
                  <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--label">
                    정산 계좌 정보
                  </td>
                  <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--value">
                    <div className="payment-order-calc-statement-modal__td-divider-wrap payment-order-calc-statement-modal__td-divider-wrap--start">
                      {withProgramDetailTdDivider([
                        data.basic.settlementAccountBankNumberPart,
                        data.basic.settlementAccountHolderPart,
                      ])}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="payment-order-calc-statement-modal__basic-group-gap" aria-hidden />

          <div className="applicant-instructor-basic-info__table-wrap payment-order-calc-statement-modal__basic-applicant-wrap">
            <table className="applicant-instructor-basic-info__table">
              <colgroup>
                <col style={{ width: '140px' }} />
                <col style={{ width: '80px' }} />
                <col />
                <col style={{ width: '160px' }} />
                <col />
              </colgroup>
              <tbody>
                <tr>
                  <td
                    colSpan={2}
                    className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--label"
                  >
                    지급 조서 처리 현황
                  </td>
                  <td
                    colSpan={3}
                    className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--value"
                  >
                    {data.basic.processingStatusClass === 'rejected' ? (
                      <div className="payment-order-calc-statement-modal__processing-status-row">
                        <span
                          className={`payment-order-admin__status-text payment-order-admin__status-text--${data.basic.processingStatusClass}`}
                        >
                          {data.basic.processingStatusDisplay}
                        </span>
                        <span
                          className="payment-order-calc-statement-modal__processing-vbar"
                          aria-hidden="true"
                        />
                        <span className="payment-order-calc-statement-modal__processing-reason">
                          사유 : {data.basic.processingRejectionReason ?? '-'}
                        </span>
                        <span
                          className="payment-order-calc-statement-modal__processing-vbar"
                          aria-hidden="true"
                        />
                        <SendNotiButton
                          onClick={() => message.info('알림 발송은 추후 연결됩니다.')}
                        />
                      </div>
                    ) : (
                      <span
                        className={`payment-order-admin__status-text payment-order-admin__status-text--${data.basic.processingStatusClass}`}
                      >
                        {data.basic.processingStatusDisplay}
                      </span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td
                    colSpan={2}
                    className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--label"
                  >
                    강의비 책정 기준
                  </td>
                  <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--value">
                    <div className="payment-order-calc-statement-modal__td-divider-wrap payment-order-calc-statement-modal__td-divider-wrap--start">
                      {withProgramDetailTdDivider([
                        data.basic.lectureFeeStandardTitle,
                        data.basic.lectureFeeStandardAmount,
                      ])}
                    </div>
                  </td>
                  <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--label">
                    사업소득자 여부
                  </td>
                  <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--value">
                    {data.basic.businessIncomeEarnerLabel}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div
        className="payment-order-calc-statement-modal__detail-section"
        style={{ minWidth: CALC_STATEMENT_CONTENT_MIN_WIDTH }}
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
          <div className="payment-order-calc-statement-modal__detail-actions">
            <AppButton
              variant="danger"
              size="filter"
              onClick={() => setPaymentRejectOpen(true)}
            >
              신청 반려
            </AppButton>
            <AppButton
              variant="primary"
              size="filter"
              modalTeal
              onClick={() => setPaymentConfirmOpen(true)}
            >
              확인 처리
            </AppButton>
          </div>
        </div>

        <Table<CalcTableRow>
          className="payment-order-calc-statement-modal__table participating-institutions-section__table"
          rowKey="key"
          columns={columns}
          dataSource={tableRows}
          pagination={false}
          size="middle"
          tableLayout="fixed"
          rowHoverable={false}
          scroll={{ x: CALC_STATEMENT_CONTENT_MIN_WIDTH }}
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
                    {formatWonPlain(data.totalAmount)}
                  </span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={5} align="center">
                  <AppButton
                    variant="primary"
                    icon={<DownloadOutlined />}
                    modalTeal
                    className="payment-order-calc-statement-modal__download-btn"
                    onClick={() => message.info('지급조서 다운로드는 추후 연결됩니다.')}
                  >
                    지급조서 다운로드
                  </AppButton>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
      </div>
    </ContentModal>
    <PaymentOrderPaymentConfirmationModal
      open={paymentConfirmOpen}
      onCancel={() => setPaymentConfirmOpen(false)}
      onConfirm={() => {
        setPaymentConfirmOpen(false)
        message.info('지급조서 확인 완료 처리는 추후 연결됩니다.')
      }}
      data={data}
    />
    <PaymentOrderPaymentRejectionModal
      open={paymentRejectOpen}
      onCancel={() => setPaymentRejectOpen(false)}
      onReject={reason => {
        setPaymentRejectOpen(false)
        setPaymentRejectReason(reason)
        setPaymentRejectDoneOpen(true)
      }}
      data={data}
    />
    <PaymentOrderPaymentRejectionResultModal
      open={paymentRejectDoneOpen}
      onClose={() => setPaymentRejectDoneOpen(false)}
      data={data}
      reason={paymentRejectReason}
    />
    </>
  )
}
