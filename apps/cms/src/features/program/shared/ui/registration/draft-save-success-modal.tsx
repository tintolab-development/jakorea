/**
 * 임시저장 성공 안내
 */

import { CmsButton, ContentModal } from '@/shared/ui'
import { CMS_ALERT_MODAL_Z_INDEX } from '@/shared/constants/modal-z-index'
import './draft-save-success-modal.css'

export const REGISTRATION_DRAFT_SAVE_SUCCESS_BODY = [
  '작성 내용이 임시 저장되었습니다.',
  '임시 저장본은 현재 브라우저에 최근 1개만 보관됩니다.',
  '현재 사용 중인 브라우저에만 저장되며, 브라우저 데이터 삭제 시 함께 삭제됩니다.',
].join('\n')

export type RegistrationDraftSaveSuccessModalProps = {
  open: boolean
  onConfirm: () => void
  body?: string
}

export function RegistrationDraftSaveSuccessModal({
  open,
  onConfirm,
  body = REGISTRATION_DRAFT_SAVE_SUCCESS_BODY,
}: RegistrationDraftSaveSuccessModalProps) {
  return (
    <ContentModal
      open={open}
      title="임시 저장 완료"
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
        {body}
      </p>
    </ContentModal>
  )
}
