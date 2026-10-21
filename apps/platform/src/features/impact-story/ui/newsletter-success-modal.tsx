import { PFAlertModal } from '@/shared/ui'
import type { NewsletterSubscribeResponse } from '../api/newsletter-client'
import { getNewsletterSubscribeResultCopy } from '../api/newsletter-result'
import styles from './newsletter-success-modal.module.css'

export type NewsletterSuccessModalProps = {
  open: boolean
  result?: NewsletterSubscribeResponse | null
  onConfirm: () => void
}

export function NewsletterSuccessModal({
  open,
  result,
  onConfirm,
}: NewsletterSuccessModalProps) {
  const copy = getNewsletterSubscribeResultCopy(result)

  return (
    <PFAlertModal
      open={open}
      confirmVariant="primary"
      title={copy.title}
      description={copy.description}
      className={styles.panel}
      backdropClassName={styles.backdrop}
      onConfirm={onConfirm}
    />
  )
}
