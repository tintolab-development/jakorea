/**
 * 임시저장 성공 안내
 */

import { CmsButton, ContentModal } from '@/shared/ui'
import { CMS_ALERT_MODAL_Z_INDEX } from '@/shared/constants/modal-z-index'
import './draft-save-success-modal.css'

export const REGISTRATION_DRAFT_SAVE_SUCCESS_BODY = [
  '작성 내용을 임시 저장하였습니다.',
  '임시 저장본은 가장 최근에 저장한 1개의 항목만 유지됩니다.',
].join('\n')

export type RegistrationDraftSaveSuccessModalProps = {
  open: boolean
  onConfirm: () => void
}

export function RegistrationDraftSaveSuccessModal({
  open,
  onConfirm,
}: RegistrationDraftSaveSuccessModalProps) {
  return (
    <ContentModal
      open={open}
      title="임시 저장"
      width={600}
      zIndex={CMS_ALERT_MODAL_Z_INDEX}
      onCancel={onConfirm}
      className="registration-draft-save-success-modal"
      footer={
        <CmsButton variant="primary" size="medium" type="button" onClick={onConfirm}>
          확인
        </CmsButton>
      }
    >
      <p className="registration-draft-save-success-modal__body">
        {REGISTRATION_DRAFT_SAVE_SUCCESS_BODY}
      </p>
    </ContentModal>
  )
}
