/**
 * 프로그램 등록 완료 성공 안내
 */

import { CmsButton, ContentModal } from '@/shared/ui'
import { CMS_ALERT_MODAL_Z_INDEX } from '@/shared/constants/modal-z-index'
import './registration-complete-success-modal.css'

export type RegistrationCompleteSuccessModalProps = {
  open: boolean
  onConfirm: () => void
}

export function RegistrationCompleteSuccessModal({
  open,
  onConfirm,
}: RegistrationCompleteSuccessModalProps) {
  return (
    <ContentModal
      open={open}
      title="프로그램 등록 완료"
      width={600}
      zIndex={CMS_ALERT_MODAL_Z_INDEX}
      onCancel={onConfirm}
      className="registration-complete-success-modal"
      footer={
        <CmsButton variant="primary" size="medium" type="button" onClick={onConfirm}>
          확인
        </CmsButton>
      }
    >
      <p className="registration-complete-success-modal__body">
        신규 프로그램 등록이 완료되었습니다.
      </p>
    </ContentModal>
  )
}
