import { useId } from 'react'
import { PFModal } from '@/shared/ui'
import { TermsContentPlaceholder } from '../../lib/terms-content-placeholder'
import { TERMS_VIEW_TITLES } from '../../lib/terms-view-config'
import type { TermsViewType } from '../../model/terms-view.types'
import { TermsViewIcon } from './terms-view-icon'
import { TermsViewLogo } from './terms-view-logo'
import styles from './terms-view-modal.module.css'

type TermsViewModalProps = {
  open: boolean
  type: TermsViewType
  onClose: () => void
}

export function TermsViewModal({ open, type, onClose }: TermsViewModalProps) {
  const titleId = useId()

  return (
    <PFModal open={open} onClose={onClose} ariaLabelledBy={titleId} className={styles.modal}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <span className={styles.icon}>
            <TermsViewIcon />
          </span>
          <h2 id={titleId} className={styles.title}>
            {TERMS_VIEW_TITLES[type]}
          </h2>
        </div>
        <span className={styles.logo}>
          <TermsViewLogo />
        </span>
      </header>

      <div className={styles.body}>
        <div className={styles.scrollArea}>
          <TermsContentPlaceholder type={type} />
        </div>
      </div>

      <footer className={styles.footer}>
        <button type="button" className={styles.closeButton} onClick={onClose}>
          닫기
        </button>
      </footer>
    </PFModal>
  )
}
