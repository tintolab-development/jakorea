import { PFButton, PFModal, PFText } from '@/shared/ui'
import styles from './payment-statement-pre-consent-modal.module.css'

type PaymentStatementPreConsentModalProps = {
  open: boolean
  onCancel: () => void
  onWriteConsent: () => void
}

export const PAYMENT_STATEMENT_PRE_CONSENT_MODAL_TITLE =
  '지급조서 사전 동의서를 작성해 주세요.'
export const PAYMENT_STATEMENT_PRE_CONSENT_MODAL_DESCRIPTION = [
  '영수증을 제출하려면 지급조서 사전 동의서가 필요해요.',
  '처음 한 번만 작성하면 10년간 유지되며,',
  '동의를 철회한 경우에는 다시 작성해야 해요.',
].join('\n')

export function PaymentStatementPreConsentModal({
  open,
  onCancel,
  onWriteConsent,
}: PaymentStatementPreConsentModalProps) {
  return (
    <PFModal open={open} size="sm" onClose={onCancel} mobilePlacement="center">
      <div className={styles.content}>
        <div className={styles.textBlock}>
          <PFText as="h2" typo="hl-lg" color="black" className={styles.title}>
            {PAYMENT_STATEMENT_PRE_CONSENT_MODAL_TITLE}
          </PFText>
          <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.description}>
            {PAYMENT_STATEMENT_PRE_CONSENT_MODAL_DESCRIPTION}
          </PFText>
        </div>
        <div className={styles.actions}>
          <PFButton type="button" variant="secondary" size="xlarge" onClick={onCancel}>
            취소
          </PFButton>
          <PFButton type="button" variant="primary" size="xlarge" onClick={onWriteConsent}>
            동의서 작성하기
          </PFButton>
        </div>
      </div>
    </PFModal>
  )
}
