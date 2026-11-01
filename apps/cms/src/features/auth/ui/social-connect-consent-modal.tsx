import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'

import {
  SOCIAL_CONNECT_CONSENT_INTRO,
  SOCIAL_CONNECT_CONSENT_MODAL_TITLE,
  SOCIAL_CONNECT_CONSENT_SECTIONS,
} from '@/features/auth/lib/social-connect-consent-copy'
import { TermsViewIcon } from '@/features/auth/ui/terms-view-modal/terms-view-icon'
import { CmsButton } from '@/shared/ui'
import { JaKoreaMemberLogo } from '@/shared/ui/icons/JaKoreaMemberLogo'

import '@/features/auth/ui/terms-view-modal/terms-view-modal.css'
import './social-connect-consent-modal.css'

type SocialConnectConsentModalProps = {
  open: boolean
  confirmLoading?: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function SocialConnectConsentModal({
  open,
  confirmLoading = false,
  onCancel,
  onConfirm,
}: SocialConnectConsentModalProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !confirmLoading) {
        onCancel()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    panelRef.current?.focus()

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [confirmLoading, onCancel, open])

  if (!open) return null

  return createPortal(
    <div
      className="terms-view-modal__backdrop"
      onMouseDown={event => {
        if (event.target === event.currentTarget && !confirmLoading) {
          onCancel()
        }
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="terms-view-modal__panel social-connect-consent-modal__panel"
      >
        <header className="terms-view-modal__header">
          <div className="terms-view-modal__title-group">
            <span className="terms-view-modal__icon" aria-hidden>
              <TermsViewIcon />
            </span>
            <h2 id={titleId} className="terms-view-modal__title">
              {SOCIAL_CONNECT_CONSENT_MODAL_TITLE}
            </h2>
          </div>
          <JaKoreaMemberLogo className="terms-view-modal__logo" />
        </header>

        <div className="terms-view-modal__body">
          <div className="terms-view-modal__scroll-area">
            <div className="terms-view-modal__content">
              <p className="terms-view-modal__paragraph">{SOCIAL_CONNECT_CONSENT_INTRO}</p>
              {SOCIAL_CONNECT_CONSENT_SECTIONS.map(section => (
                <section key={section.title} className="terms-view-modal__section">
                  <h3 className="terms-view-modal__section-heading">{section.title}</h3>
                  <ul className="social-connect-consent-modal__list">
                    {section.items.map(item => (
                      <li key={item} className="terms-view-modal__paragraph">
                        {item}
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </div>
        </div>

        <footer className="terms-view-modal__footer social-connect-consent-modal__footer">
          <CmsButton
            variant="default"
            size="h52"
            type="button"
            disabled={confirmLoading}
            onClick={onCancel} >
            취소
          </CmsButton>
          <CmsButton
            variant="secondary"
            size="h52"
            type="button"
            loading={confirmLoading}
            disabled={confirmLoading}
            onClick={onConfirm} >
            동의하고 연결하기
          </CmsButton>
        </footer>
      </div>
    </div>,
    document.body
  )
}
