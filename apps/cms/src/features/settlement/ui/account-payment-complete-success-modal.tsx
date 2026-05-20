/**
 * 정산 관리 > 계좌 지급 확인 — 일괄「계좌 지급 완료」처리 후 완료 안내 모달
 */

import { DownloadOutlined } from '@ant-design/icons'
import type { ModalProps } from 'antd'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui'
import './account-payment-complete-success-modal.css'

/** 인라인 적용 — teal-header-modal·content-modal 전역 CSS보다 우선 */
const ACCOUNT_PAYMENT_COMPLETE_SUCCESS_MODAL_STYLES: NonNullable<ModalProps['styles']> = {
  content: {
    minHeight: 206,
    padding: '26px 30px 34px',
    borderRadius: 12,
    background: '#fff',
    boxShadow: '0 0 25px 0 rgba(0, 0, 0, 0.35)',
    overflow: 'hidden',
    boxSizing: 'border-box',
  },
  body: {
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
  },
}

export interface AccountPaymentCompleteSuccessModalProps {
  open: boolean
  onCancel: () => void
  /** 성공 모달을 닫은 뒤 대량이체 미리보기 등 기존 동작 */
  onIssueBulkTransfer: () => void
}

export function AccountPaymentCompleteSuccessModal({
  open,
  onCancel,
  onIssueBulkTransfer,
}: AccountPaymentCompleteSuccessModalProps) {
  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title="계좌 지급 확인 완료"
      width={600}
      className="account-payment-complete-success-modal"
      modalStyles={ACCOUNT_PAYMENT_COMPLETE_SUCCESS_MODAL_STYLES}
      footer={
        <>
          <CmsButton variant="secondary" size="large" onClick={onCancel}>
            취소
          </CmsButton>
          <CmsButton
            variant="primary"
            size="large" style={{ minWidth: 180 }}
            icon={<DownloadOutlined />}
            onClick={onIssueBulkTransfer}
          >
            대량이체 양식 발급
          </CmsButton>
        </>
      }
    >
      <p className="account-payment-complete-success-modal__message">
        선택하신 모든 항목에 대한 강의비 계좌 지급 처리가 완료 되었습니다.
      </p>
    </ContentModal>
  )
}
