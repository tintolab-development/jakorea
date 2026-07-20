/**
 * 임시저장 덮어쓰기 확인 — 기존 임시저장본이 있을 때
 */

import { CmsButton, ContentModal } from '@/shared/ui'
import { CMS_ALERT_MODAL_Z_INDEX } from '@/shared/constants/modal-z-index'
import './draft-overwrite-confirm-modal.css'

const OVERWRITE_DESCRIPTION = [
  '아래 내용으로 작성된 임시 저장본이 있습니다.',
  '현재 작성본을 임시 저장 시 기존의 임시 저장본은 삭제됩니다.',
  '현재 내용으로 새롭게 임시 저장하시겠습니까?',
].join('\n')

export type RegistrationDraftOverwriteConfirmModalProps = {
  open: boolean
  /** 박스에 `[제목]` 으로 표시 */
  draftTitle: string
  onCancel: () => void
  onConfirm: () => void
  confirmLoading?: boolean
}

export function RegistrationDraftOverwriteConfirmModal({
  open,
  draftTitle,
  onCancel,
  onConfirm,
  confirmLoading = false,
}: RegistrationDraftOverwriteConfirmModalProps) {
  const displayTitle = draftTitle.trim() || '제목 없음'

  return (
    <ContentModal
      open={open}
      title="임시 저장"
      description={OVERWRITE_DESCRIPTION}
      width={600}
      zIndex={CMS_ALERT_MODAL_Z_INDEX}
      onCancel={onCancel}
      className="registration-draft-overwrite-confirm-modal"
      footer={
        <>
          <CmsButton
            variant="secondary"
            size="medium"
            type="button"
            onClick={onCancel}
            disabled={confirmLoading}
          >
            취소
          </CmsButton>
          <CmsButton
            variant="primary"
            size="medium"
            type="button"
            loading={confirmLoading}
            onClick={onConfirm}
          >
            임시 저장
          </CmsButton>
        </>
      }
    >
      <div className="registration-draft-overwrite-confirm-modal__panel">
        <p className="registration-draft-overwrite-confirm-modal__title">[{displayTitle}]</p>
      </div>
    </ContentModal>
  )
}
