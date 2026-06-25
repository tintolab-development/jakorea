import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import styles from './pf-modal.module.css'

type PFModalProps = {
  open: boolean
  onClose: () => void
  ariaLabelledBy?: string
  ariaDescribedBy?: string
  closeOnBackdropClick?: boolean
  className?: string
  children: ReactNode
}

export function PFModal({
  open,
  onClose,
  ariaLabelledBy,
  ariaDescribedBy,
  closeOnBackdropClick = true,
  className,
  children,
}: PFModalProps) {
  const fallbackTitleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = ariaLabelledBy ?? fallbackTitleId

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    panelRef.current?.focus()

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      className={styles.backdrop}
      onMouseDown={event => {
        if (!closeOnBackdropClick) return
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={ariaDescribedBy}
        tabIndex={-1}
        className={[styles.panel, className].filter(Boolean).join(' ')}
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}
