import { AdminButton, type AdminButtonSize } from '../button/index.js'
import { AdminContentModal } from './content-modal.js'
import { renderContentModalDescription } from './content-modal-description.js'
import './confirm-modal.css'

const DEFAULT_WIDTH = 600

export interface AdminConfirmModalProps {
  open: boolean
  title: string
  content: string
  onConfirm: () => void
  onCancel: () => void
  confirmText?: string
  cancelText?: string
  danger?: boolean
  warningMessage?: string
  width?: number
  zIndex?: number
  confirmLoading?: boolean
  footerButtonSize?: AdminButtonSize
  /** 열림/닫힘 애니메이션 완료 후 호출 — 닫힌 뒤 후속 알림을 띄울 때 사용 */
  afterOpenChange?: (open: boolean) => void
}

export function AdminConfirmModal({
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
  confirmLoading = false,
  footerButtonSize = 'medium',
  afterOpenChange,
}: AdminConfirmModalProps) {
  return (
    <AdminContentModal
      open={open}
      onCancel={onCancel}
      title={title}
      width={width}
      zIndex={zIndex}
      className="confirm-modal"
      afterOpenChange={afterOpenChange}
      footer={
        <>
          <AdminButton
            variant="secondary"
            size={footerButtonSize}
            type="button"
            onClick={onCancel}
            disabled={confirmLoading} >
            {cancelText}
          </AdminButton>
          <AdminButton
            variant={danger ? 'delete' : 'primary'}
            size={footerButtonSize}
            type="button"
            onClick={onConfirm}
            loading={confirmLoading}
            disabled={confirmLoading} >
            {confirmText}
          </AdminButton>
        </>
      }
    >
      {renderContentModalDescription(content, 'confirm-modal__content')}
      {warningMessage
        ? renderContentModalDescription(warningMessage, 'confirm-modal__warning')
        : null}
    </AdminContentModal>
  )
}
