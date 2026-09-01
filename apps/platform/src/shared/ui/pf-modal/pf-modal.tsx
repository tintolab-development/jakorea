import {
  useCallback,
  useEffect,
  useId,
  useRef,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import closeIconUrl from './icons/close.svg'
import { PFText } from '../pf-text'
import styles from './pf-modal.module.css'

export type PFModalSize = 'sm' | 'md' | 'lg'
export type PFModalMobilePlacement = 'center' | 'bottom' | 'full'

export type PFModalProps = {
  open: boolean
  onClose: () => void
  title?: ReactNode
  /**
   * 팝업 폭 variant — sm 440 / md 600 / lg 960
   * `width`가 있으면 size보다 우선
   */
  size?: PFModalSize
  /** size 대신 임의 폭이 필요할 때 */
  width?: CSSProperties['width']
  /** PC 미만에서 패널 배치. `bottom`이면 바텀시트, `full`이면 전체 화면 */
  mobilePlacement?: PFModalMobilePlacement
  ariaLabelledBy?: string
  ariaDescribedBy?: string
  closeOnBackdropClick?: boolean
  /** false면 Escape로 닫지 않음. 기본 true */
  closeOnEscape?: boolean
  className?: string
  children: ReactNode
}

const SIZE_CLASS_MAP: Record<PFModalSize, string> = {
  sm: styles.panelSm,
  md: styles.panelMd,
  lg: styles.panelLg,
}

/** 모바일에서 오버레이 제거 직후 동일 좌표 ghost click이 아래 버튼을 다시 누르는 것을 막음 */
function blockGhostClicks(durationMs = 400) {
  const blocker = document.createElement('div')
  blocker.setAttribute('aria-hidden', 'true')
  blocker.style.cssText =
    'position:fixed;inset:0;z-index:2147483647;touch-action:none;cursor:default;'
  document.body.appendChild(blocker)
  window.setTimeout(() => {
    blocker.remove()
  }, durationMs)
}

function syncBackdropToVisualViewport(element: HTMLElement) {
  const viewport = window.visualViewport
  if (!viewport) return

  element.style.top = `${viewport.offsetTop}px`
  element.style.left = `${viewport.offsetLeft}px`
  element.style.width = `${viewport.width}px`
  element.style.height = `${viewport.height}px`
  element.style.right = 'auto'
  element.style.bottom = 'auto'
  element.style.minHeight = '0'
}

function clearBackdropVisualViewportStyles(element: HTMLElement) {
  element.style.top = ''
  element.style.left = ''
  element.style.width = ''
  element.style.height = ''
  element.style.right = ''
  element.style.bottom = ''
  element.style.minHeight = ''
}

export function PFModal({
  open,
  onClose,
  title,
  size = 'md',
  width,
  mobilePlacement = 'center',
  ariaLabelledBy,
  ariaDescribedBy,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  className,
  children,
}: PFModalProps) {
  const fallbackTitleId = useId()
  const backdropRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = ariaLabelledBy ?? (title ? fallbackTitleId : undefined)
  const isBottomSheetMobile = mobilePlacement === 'bottom'
  const isFullPageMobile = mobilePlacement === 'full'

  const handleClose = useCallback(() => {
    blockGhostClicks()
    onClose()
  }, [onClose])

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panelRef.current?.focus()

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  useEffect(() => {
    if (!open || !closeOnEscape) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, closeOnEscape, handleClose])

  useEffect(() => {
    if (!open) return

    const backdrop = backdropRef.current
    const viewport = window.visualViewport
    if (!backdrop || !viewport) return

    const sync = () => {
      syncBackdropToVisualViewport(backdrop)
    }

    sync()
    viewport.addEventListener('resize', sync)
    viewport.addEventListener('scroll', sync)
    window.addEventListener('resize', sync)

    return () => {
      viewport.removeEventListener('resize', sync)
      viewport.removeEventListener('scroll', sync)
      window.removeEventListener('resize', sync)
      clearBackdropVisualViewportStyles(backdrop)
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div
      ref={backdropRef}
      className={[
        styles.backdrop,
        isBottomSheetMobile ? styles.backdropBottomSheetMobile : undefined,
        isFullPageMobile ? styles.backdropFullPageMobile : undefined,
      ]
        .filter(Boolean)
        .join(' ')}
      onPointerDown={event => {
        if (!closeOnBackdropClick) return
        if (event.target === event.currentTarget) {
          event.preventDefault()
          handleClose()
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
        className={[
          styles.panel,
          !width ? SIZE_CLASS_MAP[size] : undefined,
          isBottomSheetMobile ? styles.panelBottomSheetMobile : undefined,
          isFullPageMobile ? styles.panelFullPageMobile : undefined,
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        style={width ? { width } : undefined}
      >
        {isBottomSheetMobile ? (
          <div className={styles.handle} aria-hidden="true" />
        ) : null}
        <button
          className={styles.closeButton}
          type="button"
          aria-label="닫기"
          onPointerDown={event => {
            event.preventDefault()
            event.stopPropagation()
            handleClose()
          }}
        >
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
