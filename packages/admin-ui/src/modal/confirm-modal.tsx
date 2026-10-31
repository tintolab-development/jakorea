import { AdminButton, type AdminButtonSize } from '../button/index.js'
import { AdminContentModal } from './content-modal.js'
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
}: AdminConfirmModalProps) {
  return (
    <AdminContentModal
      open={open}
      onCancel={onCancel}
      title={title}
      width={width}
      zIndex={zIndex}
      className="confirm-modal"
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
      <p className="confirm-modal__content">{content}</p>
      {warningMessage ? <p className="confirm-modal__warning">{warningMessage}</p> : null}
    </AdminContentModal>
  )
}
