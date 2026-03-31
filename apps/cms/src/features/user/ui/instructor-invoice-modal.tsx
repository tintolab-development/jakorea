import { message } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import { TealHeaderModal } from '@/shared/ui/teal-header-modal'
import { AppButton } from '@/shared/ui/app-button'
import type { InstructorSettlementInvoiceDetail } from '@/data/mock/instructor-member-settlements'
import './instructor-invoice-modal.css'

export interface InstructorInvoiceModalProps {
  open: boolean
  onClose: () => void
  data: InstructorSettlementInvoiceDetail | null
}

export function InstructorInvoiceModal({ open, onClose, data }: InstructorInvoiceModalProps) {
  if (!open || !data) return null

  const displayTotal =
    data.totalAmount > 0
      ? data.totalAmount
      : data.lineItems.reduce((s, i) => s + (i.isPositive !== false ? i.정산금액 : 0), 0) -
        data.withholdingAmount

  return (
    <TealHeaderModal
      open={open}
      onCancel={onClose}
      title="산출 내역서"
      size="large"
      className="instructor-invoice-modal"
      footer={
        <div className="instructor-invoice-modal__modal-footer">
          <AppButton variant="cancel" size="large" onClick={onClose}>
            닫기
          </AppButton>
        </div>
      }
    >
      <section>
        <h3 className="instructor-invoice-modal__section-title">기본 정보</h3>
        <table className="instructor-invoice-modal__basic-table">
          <tbody>
            <tr>
              <th className="instructor-invoice-modal__cell-label">프로그램명</th>
              <td colSpan={3}>{data.programName}</td>
            </tr>
            <tr>
              <th className="instructor-invoice-modal__cell-label">프로그램 진행 회차</th>
              <td>{data.sessionProgress}</td>
              <th className="instructor-invoice-modal__cell-label">사업 운영 기간</th>
              <td>{data.operationPeriod}</td>
            </tr>
            <tr>
              <th className="instructor-invoice-modal__cell-label">지급조서 처리 현황</th>
              <td colSpan={3}>
                <div className="instructor-invoice-modal__payment-row">
                  <span
                    className={
                      data.paymentStatementStatusTone === 'purple'
                        ? 'instructor-invoice-modal__status-purple'
                        : data.paymentStatementStatusTone === 'mint'
                          ? 'instructor-invoice-modal__status-mint'
                          : ''
                    }
                  >
                    {data.paymentStatementStatusLabel}
                  </span>
                  <AppButton
                    variant="cancel"
                    size="small"
                    onClick={() => message.info('알림 발송은 추후 연동됩니다.')}
                  >
                    알림 발송
                  </AppButton>
                </div>
              </td>
            </tr>
            <tr>
              <th className="instructor-invoice-modal__cell-label">이체 예정일</th>
              <td colSpan={3}>{data.expectedTransferDate}</td>
            </tr>
            <tr>
              <th className="instructor-invoice-modal__cell-label">강의비 책정 기준</th>
              <td>{data.lectureFeeBasis}</td>
              <th className="instructor-invoice-modal__cell-label">사업소득자 여부</th>
              <td>{data.businessIncomeEarner}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h3 className="instructor-invoice-modal__section-title">산출 내역 상세</h3>
        <p className="instructor-invoice-modal__section-caption">
          교통비 및 숙소비는 강사가 지급 신청한 경우에만 항목 노출됩니다.
        </p>
        <table className="instructor-invoice-modal__detail-table">
          <thead>
            <tr>
              <th style={{ width: '14%' }}>참여 기관명</th>
              <th style={{ width: '18%' }}>강의 진행 일자</th>
              <th style={{ width: '10%' }}>산정 항목</th>
              <th style={{ width: '22%' }}>항목 설명</th>
              <th style={{ width: '12%' }}>정산 금액</th>
              <th style={{ width: '14%' }}>산정 기준 상세</th>
            </tr>
          </thead>
          <tbody>
            {data.lineItems.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: '#9ca3af' }}>
                  산출 항목이 없습니다.
                </td>
              </tr>
            ) : (
              <>
                {data.lineItems.map((item, idx) => (
                  <tr key={item.key}>
                    {idx === 0 ? (
                      <td rowSpan={data.lineItems.length + 1}>{data.institutionName}</td>
                    ) : null}
                    {idx === 0 ? (
                      <td rowSpan={data.lineItems.length + 1}>{data.lectureDateSessions}</td>
                    ) : null}
                    <td>{item.산정항목}</td>
                    <td>{item.항목설명}</td>
                    <td
                      className={
                        item.isPositive !== false
                          ? 'instructor-invoice-modal__amount--plus'
                          : 'instructor-invoice-modal__amount--minus'
                      }
                    >
                      {item.isPositive !== false ? '+' : ''}
                      {item.정산금액.toLocaleString()}원
                    </td>
                    <td>
                      <AppButton
                        variant="cancel"
                        size="small"
                        onClick={() => message.info('산정 기준 상세는 추후 연동됩니다.')}
                      >
                        상세 보기
                      </AppButton>
                    </td>
                  </tr>
                ))}
                <tr>
                  <td>원천징수</td>
                  <td>원천징수 {data.withholdingRatePercent}%</td>
                  <td className="instructor-invoice-modal__amount--minus">
                    -{data.withholdingAmount.toLocaleString()}원
                  </td>
                  <td>
                    <AppButton
                      variant="cancel"
                      size="small"
                      onClick={() => message.info('산정 기준 상세는 추후 연동됩니다.')}
                    >
                      상세 보기
                    </AppButton>
                  </td>
                </tr>
              </>
            )}
            <tr className="instructor-invoice-modal__footer-row">
              <td colSpan={3}>
                <strong>합계</strong>
              </td>
              <td>{data.totalFormulaLabel}</td>
              <td className="instructor-invoice-modal__total-amount">
                {displayTotal.toLocaleString()}원
              </td>
              <td>
                <div className="instructor-invoice-modal__footer-actions">
                  <AppButton
                    variant="primary"
                    size="small"
                    icon={<DownloadOutlined />}
                    onClick={() => message.success('지급조서 다운로드는 추후 연동됩니다.')}
                  >
                    지급조서 다운로드
                  </AppButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </TealHeaderModal>
  )
}
