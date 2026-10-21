import { PFAlertModal } from '@/shared/ui'
import styles from './newsletter-success-modal.module.css'

const TITLE = '뉴스레터 구독이 완료되었어요'
const DESCRIPTION = 'JA Korea의 교육 프로그램과\n새로운 소식을 이메일로 전해드릴게요.'

export type NewsletterSuccessModalProps = {
  open: boolean
  onConfirm: () => void
}

export function NewsletterSuccessModal({ open, onConfirm }: NewsletterSuccessModalProps) {
  return (
    <PFAlertModal
      open={open}
      confirmVariant="primary"
      title={TITLE}
      description={DESCRIPTION}
      className={styles.panel}
      backdropClassName={styles.backdrop}
      onConfirm={onConfirm}
    />
  )
}
