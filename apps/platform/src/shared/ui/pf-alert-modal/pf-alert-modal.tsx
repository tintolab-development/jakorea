import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { PFButton } from '../pf-button'
import { PFText } from '../pf-text'
import styles from './pf-alert-modal.module.css'

type PFAlertConfirmVariant = 'primary' | 'secondary' | 'tertiary'

export type PFAlertModalProps = {
  open: boolean
  onConfirm: () => void
  /** Escape 시. 없으면 onConfirm (기존 안내 팝업 호환) */
  onDismiss?: () => void
  title: ReactNode
  description?: ReactNode
  confirmLabel?: string
  /** 확인 버튼 variant. 기본 tertiary */
  confirmVariant?: PFAlertConfirmVariant
  confirmLoading?: boolean
  confirmDisabled?: boolean
  /** description 아래·확인 버튼 위 추가 컨텐츠 (예: 비밀번호 입력) */
  children?: ReactNode
  className?: string
  ariaLabelledBy?: string
  ariaDescribedBy?: string
}

export function PFAlertModal({
  open,
  onConfirm,
  onDismiss,
  title,
  description,
  confirmLabel = '확인',
  confirmVariant = 'tertiary',
  confirmLoading = false,
  confirmDisabled = false,
  children,
  className,
  ariaLabelledBy,
  ariaDescribedBy,
}: PFAlertModalProps) {
  const fallbackTitleId = useId()
  const fallbackDescriptionId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const wasOpenRef = useRef(false)
  const onConfirmRef = useRef(onConfirm)
  const onDismissRef = useRef(onDismiss)
  const titleId = ariaLabelledBy ?? fallbackTitleId
  const descriptionId = ariaDescribedBy ?? (description ? fallbackDescriptionId : undefined)
  const isConfirmBlocked = confirmLoading || confirmDisabled

  onConfirmRef.current = onConfirm
  onDismissRef.current = onDismiss

  useEffect(() => {
    if (!open) {
      wasOpenRef.current = false
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !confirmLoading) {
        ;(onDismissRef.current ?? onConfirmRef.current)()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    // 열릴 때 한 번만 포커스 — children(인풋)이 있으면 패널 포커스로 입력 포커스를 뺏지 않음
    if (!wasOpenRef.current) {
      wasOpenRef.current = true
      if (!children) {
        panelRef.current?.focus()
      }
    }

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, confirmLoading, children])

  if (!open) return null

  return createPortal(
    <div className={styles.backdrop}>
      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className={[styles.panel, className].filter(Boolean).join(' ')}
      >
        <div className={styles.content}>
          <PFText as="div" typo="hl-lg" color="black" id={titleId} className={styles.title}>
            {title}
          </PFText>
          {description ? (
            <PFText
              as="p"
              typo="bd-md-rg"
              color="neutral-warm-600"
              id={descriptionId}
              className={styles.description}
            >
              {description}
            </PFText>
          ) : null}
          {children ? <div className={styles.extra}>{children}</div> : null}
        </div>

        <PFButton
          className={styles.confirmButton}
          variant={confirmVariant}
          size="xlarge"
          width="100%"
          disabled={isConfirmBlocked}
          onClick={() => onConfirmRef.current()}
        >
          {confirmLoading ? '처리 중…' : confirmLabel}
        </PFButton>
      </div>
    </div>,
    document.body
  )
}
