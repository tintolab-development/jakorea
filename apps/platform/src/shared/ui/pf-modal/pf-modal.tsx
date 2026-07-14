import { useEffect, useId, useRef, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import closeIconUrl from './icons/close.svg'
import { PFText } from '../pf-text'
import styles from './pf-modal.module.css'

type PFModalProps = {
  open: boolean
  onClose: () => void
  title?: ReactNode
  width?: CSSProperties['width']
  ariaLabelledBy?: string
  ariaDescribedBy?: string
  closeOnBackdropClick?: boolean
  className?: string
  children: ReactNode
}

export function PFModal({
  open,
  onClose,
  title,
  width,
  ariaLabelledBy,
  ariaDescribedBy,
  closeOnBackdropClick = true,
  className,
  children,
}: PFModalProps) {
  const fallbackTitleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = ariaLabelledBy ?? (title ? fallbackTitleId : undefined)

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
        style={width ? { width } : undefined}
      >
        <button className={styles.closeButton} type="button" aria-label="닫기" onClick={onClose}>
          <img className={styles.closeIcon} src={closeIconUrl} alt="" aria-hidden="true" />
        </button>
        {title ? (
          <PFText as="div" typo="hl-lg" color="black" id={titleId} className={styles.title}>
            {title}
          </PFText>
        ) : null}
        {children}
      </div>
    </div>,
    document.body,
  )
}
