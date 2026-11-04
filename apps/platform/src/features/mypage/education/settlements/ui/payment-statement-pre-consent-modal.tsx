import { PFButton, PFModal, PFText } from '@/shared/ui'
import styles from './payment-statement-pre-consent-modal.module.css'

type PaymentStatementPreConsentModalProps = {
  open: boolean
  onCancel: () => void
  onWriteConsent: () => void
}

export const PAYMENT_STATEMENT_PRE_CONSENT_MODAL_TITLE =
  '영수증 발급 사전 동의서를 작성해 주세요.'
export const PAYMENT_STATEMENT_PRE_CONSENT_MODAL_DESCRIPTION = [
  '영수증을 제출하려면 영수증 발급 사전 동의서가 필요해요.',
  '지급조서 사전 동의서와는 별도 서류이며,',
  '제출 완료 여부는 서버 동의 상태를 기준으로 확인해요.',
].join('\n')

export function PaymentStatementPreConsentModal({
  open,
  onCancel,
  onWriteConsent,
}: PaymentStatementPreConsentModalProps) {
  return (
    <PFModal
      open={open}
      size="sm"
      onClose={onCancel}
      mobilePlacement="center"
      showCloseButton={false}
    >
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
