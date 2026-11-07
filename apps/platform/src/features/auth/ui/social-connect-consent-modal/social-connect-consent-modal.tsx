import { useId } from 'react'
import logoUrl from '@/shared/assets/brand/ja-logo-mobile.png'
import { PFButton, PFModal, PFText } from '@/shared/ui'
import {
  SOCIAL_CONNECT_CONSENT_INTRO,
  SOCIAL_CONNECT_CONSENT_MODAL_TITLE,
  SOCIAL_CONNECT_CONSENT_SECTIONS,
} from '../../lib/social-connect-consent-copy'
import { TermsViewIcon } from '../terms-view-modal/terms-view-icon'
import termsStyles from '../terms-view-modal/terms-view-modal.module.css'
import styles from './social-connect-consent-modal.module.css'

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

  return (
    <PFModal
      showCloseButton={false}
      closeOnBackdropClick={!confirmLoading}
      closeOnEscape={!confirmLoading}
      open={open}
      onClose={onCancel}
      ariaLabelledBy={titleId}
      className={[termsStyles.modal, styles.modal].join(' ')}
      mobilePlacement="full"
    >
      <header className={termsStyles.header}>
        <div className={termsStyles.titleGroup}>
          <span className={termsStyles.icon}>
            <TermsViewIcon />
          </span>
          <PFText id={titleId} className={termsStyles.title}>
            {SOCIAL_CONNECT_CONSENT_MODAL_TITLE}
          </PFText>
        </div>
        <img className={termsStyles.logo} src={logoUrl} alt="JA Korea" />
      </header>

      <div className={termsStyles.body}>
        <div className={termsStyles.scrollArea}>
          <div className={termsStyles.content}>
            <PFText as="p" typo="bd-md-rg" color="black" className={termsStyles.paragraph}>
              {SOCIAL_CONNECT_CONSENT_INTRO}
            </PFText>
            {SOCIAL_CONNECT_CONSENT_SECTIONS.map(section => (
              <section key={section.title} className={termsStyles.section}>
                <PFText as="h3" typo="bd-md-sb" color="black" className={termsStyles.sectionHeading}>
                  {section.title}
                </PFText>
                <ul className={styles.list}>
                  {section.items.map(item => (
                    <li key={item} className={styles.item}>
                      <PFText as="span" typo="bd-md-rg" color="black">
                        {item}
                      </PFText>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </div>

      <footer className={termsStyles.footer}>
        <div className={styles.footerActions}>
          <button
            type="button"
            className={termsStyles.closeButton}
            disabled={confirmLoading}
            onClick={onCancel}
          >
            취소
          </button>
          <PFButton
            variant="secondary"
            size="large"
            className={styles.confirmButton}
            disabled={confirmLoading}
            onClick={onConfirm}
          >
            {confirmLoading ? '연결 중…' : '동의하고 연결하기'}
          </PFButton>
        </div>
      </footer>
    </PFModal>
  )
}
