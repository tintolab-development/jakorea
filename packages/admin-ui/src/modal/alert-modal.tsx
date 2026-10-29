import { useCallback, useEffect, type ReactNode } from 'react'
import { AdminButton, type AdminButtonSize } from '../button/index.js'
import { AdminContentModal } from './content-modal.js'
import './alert-modal.css'

const DEFAULT_WIDTH = 600

export interface AdminAlertModalProps {
  open: boolean
  onClose: () => void
  title: string
  content: ReactNode
  width?: number
  confirmLabel?: string
  zIndex?: number
  onConfirm?: () => void
  footerButtonSize?: AdminButtonSize
}

export function AdminAlertModal({
  open,
  onClose,
  title,
  content,
  width = DEFAULT_WIDTH,
  confirmLabel = '확인',
  zIndex,
  onConfirm,
  footerButtonSize = 'medium',
}: AdminAlertModalProps) {
  const handleConfirm = useCallback(() => {
    onConfirm?.()
    onClose()
  }, [onConfirm, onClose])

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter') return
      if (event.isComposing || event.keyCode === 229) return
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
      event.preventDefault()
      event.stopPropagation()
      handleConfirm()
    }

    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [open, handleConfirm])

  return (
    <AdminContentModal
      open={open}
      onCancel={onClose}
      title={title}
      titleBodyGap="always"
      width={width}
      zIndex={zIndex}
      className="alert-modal"
      footer={
        <AdminButton variant="secondary" size={footerButtonSize} type="button" onClick={handleConfirm}>
          {confirmLabel}
        </AdminButton>
      }
    >
      <p className="alert-modal__content">{content}</p>
    </AdminContentModal>
  )
}
