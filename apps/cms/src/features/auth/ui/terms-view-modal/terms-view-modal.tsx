import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { CmsRadio } from '@/shared/ui/cms-radio'
import { JaKoreaMemberLogo } from '@/shared/ui/icons/JaKoreaMemberLogo'
import { TermsContentPlaceholder } from '../../lib/terms-content-placeholder'
import {
  TERMS_CONSENT_OPTIONS,
  TERMS_VIEW_TITLES,
  type TermsConsentChoice,
  type TermsViewType,
} from '../../lib/terms-view-config'
import { TermsViewIcon } from './terms-view-icon'
import './terms-view-modal.css'

type TermsViewModalProps = {
  open: boolean
  type: TermsViewType
  /** true 동의 · false 동의하지 않음 · null 미선택(라디오 모두 해제) */
  agreed: boolean | null
  onAgreedChange: (agreed: boolean) => void
  onClose: () => void
}

export function TermsViewModal({
  open,
  type,
  agreed,
  onAgreedChange,
  onClose,
}: TermsViewModalProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const consentValue: TermsConsentChoice | null =
    agreed == null ? null : agreed ? 'agree' : 'disagree'

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
      className="terms-view-modal__backdrop"
      onMouseDown={event => {
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
        tabIndex={-1}
        className="terms-view-modal__panel"
      >
        <header className="terms-view-modal__header">
          <div className="terms-view-modal__title-group">
            <span className="terms-view-modal__icon">
              <TermsViewIcon />
            </span>
            <h2 id={titleId} className="terms-view-modal__title">
              {TERMS_VIEW_TITLES[type]}
            </h2>
          </div>
          <JaKoreaMemberLogo className="terms-view-modal__logo" />
        </header>

        <div className="terms-view-modal__body">
          <div className="terms-view-modal__scroll-area">
            <TermsContentPlaceholder type={type} />
          </div>
        </div>

        <div className="terms-view-modal__consent">
          <CmsRadio.Group
            className="terms-view-modal__consent-group"
            value={consentValue}
            onChange={event => onAgreedChange(event.target.value === 'agree')}
          >
            {TERMS_CONSENT_OPTIONS.map(option => (
              <CmsRadio key={option.value} value={option.value} size="large">
                {option.label}
              </CmsRadio>
            ))}
          </CmsRadio.Group>
        </div>

        <footer className="terms-view-modal__footer">
          <button type="button" className="terms-view-modal__close-button" onClick={onClose}>
            닫기
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  )
}
