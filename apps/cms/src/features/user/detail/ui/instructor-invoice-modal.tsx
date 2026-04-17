import { DownloadOutlined } from '@ant-design/icons'
import { PlainHeaderModal } from '@/shared/ui/plain-header-modal'
import { AppButton } from '@/shared/ui/app-button'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import {
  getInstructorSettlementInvoiceStatusPresentation,
  type InstructorSettlementInvoiceDetail,
} from '@/data/mock/instructor-member-settlements'
import './instructor-invoice-modal.css'

export interface InstructorInvoiceModalProps {
  open: boolean
  onClose: () => void
  data: InstructorSettlementInvoiceDetail | null
}

export function InstructorInvoiceModal({ open, onClose, data }: InstructorInvoiceModalProps) {
  if (!open || !data) return null

  const paymentStatementPresentation = getInstructorSettlementInvoiceStatusPresentation(
    data.paymentStatementStatus
  )

  const displayTotal =
    data.totalAmount > 0
      ? data.totalAmount
      : data.lineItems.reduce((s, i) => s + (i.isPositive !== false ? i.정산금액 : 0), 0) -
        data.withholdingAmount

  return (
    <PlainHeaderModal
      open={open}
      onCancel={onClose}
      title="산출 내역서"
      size="large"
      className="instructor-invoice-modal"
      footer={
        <div className="instructor-invoice-modal__modal-footer">
          <AppButton variant="cancel" size="filter" onClick={onClose}>
            닫기
          </AppButton>
        </div>
      }
    >
      <section>
        <div className="instructor-invoice-modal__basic-group">
          <DetailInfoForm title="기본 정보" className="instructor-invoice-modal__detail-form-card">
            <DetailInfoForm.Row type="double">
              <DetailInfoForm.Field label="프로그램명" view={<span>{data.programName}</span>} />
              <DetailInfoForm.Field
                label="사업 운영 기간"
                view={<span>{data.operationPeriod}</span>}
              />
            </DetailInfoForm.Row>
            <DetailInfoForm.Row type="double">
              <DetailInfoForm.Field
                label="프로그램 진행 회차"
                view={<span>{data.sessionProgress}</span>}
              />
              <DetailInfoForm.Field
                label="지급조서 처리 현황"
                view={
                  <div className="instructor-invoice-modal__payment-row">
                    <span
                      style={{
                        color: paymentStatementPresentation.color,
                        fontWeight: 600,
                      }}
                    >
                      {paymentStatementPresentation.label}
                    </span>
                    <span className="instructor-invoice-modal__payment-row-separator">|</span>
                    <AppButton
                      variant="viewDetails"
                      size="large"
                      onClick={() => window.alert('준비 중입니다.')}
                    >
                      알림 발송
                    </AppButton>
                  </div>
                }
              />
            </DetailInfoForm.Row>
            <DetailInfoForm.Row type="double">
              <DetailInfoForm.Field
                label="이체 예정일"
                view={<span>{data.expectedTransferDate}</span>}
              />
              <DetailInfoForm.Field
                label="강의비 책정 기준"
                view={<span>{data.lectureFeeBasis}</span>}
              />
            </DetailInfoForm.Row>
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="사업소득자 여부"
                view={<span>{data.businessIncomeEarner}</span>}
              />
            </DetailInfoForm.Row>
          </DetailInfoForm>
        </div>
      </section>

      <section>
        <div style={{ marginBottom: '8px' }}>
          <span className="info-section-title">산출 내역 상세</span>
          <span className="info-section-description">
            교통비 및 숙소비는 강사가 지급 신청한 경우에만 항목 노출됩니다.
          </span>
        </div>
        <div className="instructor-invoice-modal__detail-card">
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
                          variant="viewDetails"
                          size="large"
                          onClick={() => window.alert('준비 중입니다.')}
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
                        variant="viewDetails"
                        size="large"
                        onClick={() => window.alert('준비 중입니다.')}
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
                      size="large"
                      icon={<DownloadOutlined />}
                      onClick={() => window.alert('준비 중입니다.')}
                    >
                      지급조서 발급
                    </AppButton>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </PlainHeaderModal>
  )
}
