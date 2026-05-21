/**
 * 프로그램 정산 내역 상세 모달
 * 캘린더 셀 태그 클릭 또는 우측 상세 패널 아이템 클릭 시 노출
 */

import { useState } from 'react'
import { Input, Modal } from 'antd'
import { TealHeaderModal } from '@/shared/ui/teal-header-modal'
import { CmsButton } from '@/shared/ui'
import { SettlementStatusBadge } from '@/shared/components/settlement-status-badge'
import type { SettlementDetail } from '@/data/mock/school-detail'
import './settlement-detail-modal.css'

export interface BankInfo {
  bankName: string
  accountNumber: string
  accountHolder: string
}

export interface SettlementDetailModalProps {
  open: boolean
  onClose: () => void
  detail: SettlementDetail | null
  teacherName?: string
  bankInfo?: BankInfo
  /** 반려 시 rowId와 사유를 부모에 전달 */
  onReject?: (reason: string) => void
  /** 입금 완료 시 부모에 전달 */
  onPaymentComplete?: () => void
}

export function SettlementDetailModal({
  open,
  onClose,
  detail,
  teacherName = '강사',
  bankInfo,
  onReject,
  onPaymentComplete,
}: SettlementDetailModalProps) {
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmedReason, setConfirmedReason] = useState('')
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [paymentConfirmOpen, setPaymentConfirmOpen] = useState(false)

  if (!detail) return null

  const withholdingAmount = Math.round(
    detail.items.reduce((s, i) => s + i.amount, 0) * (detail.withholdingRate / 100),
  )
  const netTotal =
    detail.items.reduce((s, i) => s + i.amount, 0) - withholdingAmount

  return (
    <>
    <TealHeaderModal
      open={open}
      onCancel={onClose}
      title="프로그램 정산 내역 상세"
      width={1400}
      className="teal-header-modal--settlement-detail"
      footer={
        <>
          <CmsButton variant="secondary" size="large" onClick={onClose}>
            닫기
          </CmsButton>
          <CmsButton variant="delete" size="large" onClick={() => setRejectOpen(true)} disabled={detail.status === 'completed'}>
            지급 신청 반려
          </CmsButton>
          <CmsButton variant="primary" size="large" onClick={() => setPaymentOpen(true)} disabled={detail.status === 'completed'}>
            강의료 지급
          </CmsButton>
        </>
      }
    >
      {/* 상단 기본 정보 */}
      <div className="settlement-detail__info">
        <table>
          <tbody>
            <tr>
              <th>프로그램명</th>
              <td colSpan={3}>{detail.programName}</td>
            </tr>
            <tr>
              <td colSpan={4} className="settlement-detail__split-td">
                <div className="settlement-detail__info-split">
                  <div className="settlement-detail__info-split-cell">
                    <span className="settlement-detail__info-split-label">강의 진행일 및 시간</span>
                    <span className="settlement-detail__info-split-value">{detail.lectureDate} | {detail.lectureDuration}</span>
                  </div>
                  <div className="settlement-detail__info-split-cell">
                    <span className="settlement-detail__info-split-label">강의 진행 시간</span>
                    <span className="settlement-detail__info-split-value">{detail.lectureHours}</span>
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <td colSpan={4} className="settlement-detail__split-td">
                <div className="settlement-detail__info-split">
                  <div className="settlement-detail__info-split-cell">
                    <span className="settlement-detail__info-split-label">정산 금액</span>
                    <span className="settlement-detail__info-split-value">{detail.settlementAmount.toLocaleString()}원</span>
                  </div>
                  <div className="settlement-detail__info-split-cell">
                    <span className="settlement-detail__info-split-label">정산 상태</span>
                    <span className="settlement-detail__info-split-value">
                      <SettlementStatusBadge status={detail.status} />
                    </span>
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <th>비고</th>
              <td colSpan={3}>{detail.remark || '\u00A0'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 정산 항목 */}
      <div className="settlement-detail__section">
        <h3 className="settlement-detail__section-title">정산 항목</h3>
        <p className="settlement-detail__section-desc">
          교통 및 숙소비는 강사가 지급 신청한 경우에 한해 금액이 노출됩니다.
        </p>
        <div className="settlement-detail__items">
          <table>
            <colgroup>
              <col className="col-label" />
              <col className="col-desc" />
              <col className="col-amount" />
              <col className="col-action" />
            </colgroup>
            <thead>
              <tr>
                <th>항목명</th>
                <th>설명</th>
                <th>정산 금액</th>
                <th>금액 산정 상세</th>
              </tr>
            </thead>
            <tbody>
              {detail.items.map((item) => (
                <tr key={item.label}>
                  <td>{item.label}</td>
                  <td>{item.description}</td>
                  <td>+{item.amount.toLocaleString()}원</td>
                  <td>
                    <CmsButton
                      variant="secondary"
                      size="small"
                      className="settlement-detail__view-btn"
                    >
                      상세보기
                    </CmsButton>
                  </td>
                </tr>
              ))}
              <tr>
                <td>원천징수</td>
                <td>원천징수 {detail.withholdingRate}%</td>
                <td className="settlement-detail__withholding-amount">
                  -{withholdingAmount.toLocaleString()}원
                </td>
                <td>
                  <CmsButton
                    variant="secondary"
                    size="small"
                    className="settlement-detail__view-btn"
                  >
                    상세보기
                  </CmsButton>
                </td>
              </tr>
              <tr className="settlement-detail__total-row">
                <td>합계</td>
                <td>기본급 + 교통비 + 숙박비</td>
                <td>{netTotal.toLocaleString()}원</td>
                <td>
                  <CmsButton
                    variant="primary"
                    size="small"
                    className="settlement-detail__view-btn"
                  >
                    지급조서 발급
                  </CmsButton>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </TealHeaderModal>

    <TealHeaderModal
      open={rejectOpen}
      onCancel={() => { setRejectOpen(false); setRejectReason('') }}
      title="지급 신청 반려"
      width={800}
      className="teal-header-modal--settlement-reject"
      footer={
        <>
          <CmsButton variant="secondary" size="large" onClick={() => { setRejectOpen(false); setRejectReason('') }}>
            취소
          </CmsButton>
          <CmsButton variant="delete" size="large" onClick={() => {
            const reason = rejectReason || '제출 서류 미비'
            setConfirmedReason(reason)
            setRejectOpen(false)
            setRejectReason('')
            onReject?.(reason)
            setConfirmOpen(true)
          }}>
            반려
          </CmsButton>
        </>
      }
    >
      <div className="settlement-reject__body">
        <label className="settlement-reject__label">반려 사유</label>
        <Input
          placeholder="지급 반려 사유를 입력하세요"
          value={rejectReason}
          onChange={e => setRejectReason(e.target.value)}
          className="settlement-reject__input"
        />
      </div>
    </TealHeaderModal>

    <Modal
      open={confirmOpen}
      onCancel={() => setConfirmOpen(false)}
      closable={false}
      footer={null}
      width={600}
      className="settlement-reject-confirm"
      centered
      destroyOnClose
    >
      <div className="settlement-reject-confirm__content">
        <h2 className="settlement-reject-confirm__title">지급 반려 안내</h2>
        <div className="settlement-reject-confirm__body">
          <p className="settlement-reject-confirm__line">
            <strong>[{teacherName}]</strong> 강사님의 강의료 지급이 반려되었습니다.
          </p>
          <p className="settlement-reject-confirm__line">
            (사유 : {confirmedReason})
          </p>
        </div>
        <div className="settlement-reject-confirm__footer">
          <CmsButton variant="secondary" size="large" onClick={() => setConfirmOpen(false)}>
            확인
          </CmsButton>
        </div>
      </div>
    </Modal>

    <TealHeaderModal
      open={paymentOpen}
      onCancel={() => setPaymentOpen(false)}
      title="강의료 지급"
      width={800}
      className="teal-header-modal--settlement-payment"
      footer={
        <>
          <CmsButton variant="secondary" size="large" onClick={() => setPaymentOpen(false)}>
            확인
          </CmsButton>
          <CmsButton
            variant="primary"
            size="large"
            onClick={() => {
              setPaymentOpen(false)
              onPaymentComplete?.()
              setPaymentConfirmOpen(true)
            }}
          >
            입금 완료
          </CmsButton>
        </>
      }
    >
      <div className="settlement-payment__body">
        <div className="settlement-payment__table-wrap">
          <table className="settlement-payment__table">
            <tbody>
              <tr>
                <th>정산 내용</th>
                <td>{detail.programName} {detail.lectureDate} 강의료</td>
              </tr>
              <tr>
                <th>정산 금액</th>
                <td className="settlement-payment__amount">{netTotal.toLocaleString()}원</td>
              </tr>
              <tr>
                <th>지급 계좌번호</th>
                <td>
                  {bankInfo ? (
                    <span className="settlement-payment__account">
                      {bankInfo.bankName} {bankInfo.accountNumber}
                      <span className="settlement-payment__divider">|</span>
                      {bankInfo.accountHolder}
                    </span>
                  ) : '-'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="settlement-payment__guide">
          <p>위 내용을 확인하신 후, 안내된 계좌번호로 정확한 금액을 입금해 주세요.</p>
          <p>입금이 완료되면 아래의 <strong>[입금 완료]</strong> 버튼을 눌러주세요.</p>
        </div>
      </div>
    </TealHeaderModal>

    <Modal
      open={paymentConfirmOpen}
      onCancel={() => setPaymentConfirmOpen(false)}
      closable={false}
      footer={null}
      width={600}
      className="settlement-payment-confirm"
      centered
      destroyOnClose
    >
      <div className="settlement-payment-confirm__content">
        <h2 className="settlement-payment-confirm__title">강의료 지급 안내</h2>
        <p className="settlement-payment-confirm__desc">
          <strong>[{teacherName}]</strong> 강사님의 강의료 지급을 완료 처리하였습니다.
        </p>
        <div className="settlement-payment-confirm__footer">
          <CmsButton variant="secondary" size="large" onClick={() => setPaymentConfirmOpen(false)}>
            확인
          </CmsButton>
        </div>
      </div>
    </Modal>
    </>
  )
}
