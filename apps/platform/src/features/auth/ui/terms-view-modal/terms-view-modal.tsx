import { useId } from 'react'
import logoUrl from '@/shared/assets/brand/ja-logo-mobile.png'
import { PFButton, PFModal, PFText } from '@/shared/ui'
import { TermsContentPlaceholder } from '../../lib/terms-content-placeholder'
import { TERMS_VIEW_TITLES } from '../../lib/terms-view-config'
import type { TermsViewType } from '../../model/terms-view.types'
import { TermsViewIcon } from './terms-view-icon'
import styles from './terms-view-modal.module.css'

type TermsViewModalProps = {
  open: boolean
  type: TermsViewType
  onClose: () => void
  /** 가입 화면에서만 전달. 없으면 본문 확인용으로 라디오를 숨긴다. */
  agreed?: boolean
  onAgreedChange?: (agreed: boolean) => void
  /** 기본은 윤곽선 닫기 */
  actionLabel?: string
  actionVariant?: 'outline' | 'primary'
}

const CONSENT_OPTIONS = [
  { value: true, label: '동의합니다' },
  { value: false, label: '동의하지 않습니다' },
] as const

export function TermsViewModal({
  open,
  type,
  onClose,
  agreed = false,
  onAgreedChange,
  actionLabel = '닫기',
  actionVariant = 'outline',
}: TermsViewModalProps) {
  const titleId = useId()
  const radioName = useId()
  const showConsent = onAgreedChange != null

  return (
    <PFModal
      open={open}
      onClose={onClose}
      ariaLabelledBy={titleId}
      className={styles.modal}
      mobilePlacement={'full'}
    >
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <span className={styles.icon}>
            <TermsViewIcon />
          </span>
          <PFText id={titleId} className={styles.title}>
            {TERMS_VIEW_TITLES[type]}
          </PFText>
        </div>
        <img className={styles.logo} src={logoUrl} alt="JA Korea" />
      </header>

      <div className={styles.body}>
        <div className={styles.scrollArea}>
          <TermsContentPlaceholder type={type} />
        </div>
      </div>

      {showConsent ? (
        <div className={styles.consent} role="radiogroup" aria-label="약관 동의">
          {CONSENT_OPTIONS.map(option => (
            <label key={option.label} className={styles.consentOption}>
              <input
                className={styles.radioInput}
                type="radio"
                name={radioName}
                checked={agreed === option.value}
                onChange={() => onAgreedChange(option.value)}
              />
              <span className={styles.radioMark} aria-hidden="true" />
              <PFText typo="bd-md-md" color="black">
                {option.label}
              </PFText>
            </label>
          ))}
        </div>
      ) : null}

      <footer className={styles.footer}>
        {actionVariant === 'primary' ? (
          <PFButton
            variant="primary"
            size="large"
            width="100%"
            className={styles.confirmButton}
            onClick={onClose}
          >
            {actionLabel}
          </PFButton>
        ) : (
          <button type="button" className={styles.closeButton} onClick={onClose}>
            {actionLabel}
          </button>
        )}
      </footer>
    </PFModal>
  )
}
