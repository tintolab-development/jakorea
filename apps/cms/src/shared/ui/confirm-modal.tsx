/**
 * 확인·취소 모달 — ContentModal + CmsButton (Ant Design Modal.confirm 대체)
 */

import { ContentModal } from './content-modal'
import { CmsButton } from './cms-button'
import './confirm-modal.css'

const DEFAULT_WIDTH = 600

interface ConfirmModalProps {
  open: boolean
  title: string
  content: string
  onConfirm: () => void
  onCancel: () => void
  confirmText?: string
  cancelText?: string
  danger?: boolean
  /** 삭제 시 표시할 경고 메시지 (예: "삭제된 항목은 복구할 수 없습니다.") */
  warningMessage?: string
  /** 모달 너비(px). 기본 600 */
  width?: number
  zIndex?: number
}

export function ConfirmModal({
  open,
  title,
  content,
  onConfirm,
  onCancel,
  confirmText = '확인',
  cancelText = '취소',
  danger = false,
  warningMessage,
  width = DEFAULT_WIDTH,
  zIndex = 1001,
}: ConfirmModalProps) {
  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title={title}
      width={width}
      zIndex={zIndex}
      className="confirm-modal"
      footer={
        <>
          <CmsButton variant="secondary" size="medium" type="button" onClick={onCancel}>
            {cancelText}
          </CmsButton>
          <CmsButton
            variant={danger ? 'delete' : 'primary'}
            size="medium"
            type="button"
            onClick={onConfirm}
          >
            {confirmText}
          </CmsButton>
        </>
      }
    >
      <p className="confirm-modal__content">{content}</p>
      {warningMessage ? <p className="confirm-modal__warning">{warningMessage}</p> : null}
    </ContentModal>
  )
}
