import { useCallback, useEffect, useRef, type ReactNode } from 'react'
import { CMS_ALERT_MODAL_Z_INDEX } from '@/shared/constants/modal-z-index'
import { CMS_ALERT_MODAL_CLOSED_EVENT } from './cms-alert-modal-api'
import { ContentModal } from './content-modal'
import { CmsButton } from './cms-button'
import './alert-modal.css'

const DEFAULT_WIDTH = 600

export interface AlertModalProps {
  open: boolean
  onClose: () => void
  title: string
  /** 문자열의 `\n` 은 `white-space: pre-wrap`으로 줄바꿈됩니다. ReactNode도 가능합니다. */
  content: ReactNode
  /** 모달 너비(px). 기본 600 */
  width?: number
  /** 기본값 확인 */
  confirmLabel?: string
  zIndex?: number
  /** 확인 버튼 클릭 시 (닫기 전 호출) */
  onConfirm?: () => void
}

/**
 * 단일 확인 버튼 안내 모달 (선택 안내·토스트 대체 문구 등).
 * 레이아웃·타이포는 디자인 스펙과 `ContentModal` 헤더 스타일을 따릅니다.
 * MFA OTP 등 하위 모달에 포커스가 남아 있어도 Enter로 확인·닫기 가능.
 */
export function AlertModal({
  open,
  onClose,
  title,
  content,
  width = DEFAULT_WIDTH,
  confirmLabel = '확인',
  zIndex = CMS_ALERT_MODAL_Z_INDEX,
  onConfirm,
}: AlertModalProps) {
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

    // MFA OTP 입력 등 뒤쪽 포커스에서도 동작하도록 capture
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [open, handleConfirm])

  const wasOpenRef = useRef(false)
  useEffect(() => {
    if (wasOpenRef.current && !open) {
      window.dispatchEvent(new CustomEvent(CMS_ALERT_MODAL_CLOSED_EVENT))
    }
    wasOpenRef.current = open
  }, [open])

  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title={title}
      titleBodyGap="always"
      width={width}
      zIndex={zIndex}
      className="alert-modal"
      footer={
        <CmsButton variant="secondary" size="medium" type="button" onClick={handleConfirm}>
          {confirmLabel}
        </CmsButton>
      }
    >
      <p className="alert-modal__content">{content}</p>
    </ContentModal>
  )
}
