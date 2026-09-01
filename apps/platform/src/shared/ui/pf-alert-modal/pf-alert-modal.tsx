import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { PFButton } from '../pf-button'
import { PFText } from '../pf-text'
import styles from './pf-alert-modal.module.css'

type PFAlertConfirmVariant = 'primary' | 'secondary' | 'tertiary'

export type PFAlertModalProps = {
  open: boolean
  onConfirm: () => void
  title: ReactNode
  description?: ReactNode
  confirmLabel?: string
  /** 확인 버튼 variant. 기본 tertiary */
  confirmVariant?: PFAlertConfirmVariant
  className?: string
  ariaLabelledBy?: string
  ariaDescribedBy?: string
}

export function PFAlertModal({
  open,
  onConfirm,
  title,
  description,
  confirmLabel = '확인',
  confirmVariant = 'tertiary',
  className,
  ariaLabelledBy,
  ariaDescribedBy,
}: PFAlertModalProps) {
  const fallbackTitleId = useId()
  const fallbackDescriptionId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = ariaLabelledBy ?? fallbackTitleId
  const descriptionId = ariaDescribedBy ?? (description ? fallbackDescriptionId : undefined)

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onConfirm()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    panelRef.current?.focus()

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onConfirm])

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
        </div>

        <PFButton
          className={styles.confirmButton}
          variant={confirmVariant}
          size="xlarge"
          width="100%"
          onClick={onConfirm}
        >
          {confirmLabel}
        </PFButton>
      </div>
    </div>,
    document.body
  )
}
