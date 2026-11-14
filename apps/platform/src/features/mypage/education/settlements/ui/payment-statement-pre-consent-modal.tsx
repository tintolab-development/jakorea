import type { SettlementDocumentKind } from '../lib/settlement-status-ui'
import { settlementPreConsentModalCopy } from '../lib/settlement-pre-consent-copy'
import { PFButton, PFModal, PFText } from '@/shared/ui'
import styles from './payment-statement-pre-consent-modal.module.css'

type PaymentStatementPreConsentModalProps = {
  open: boolean
  variant?: SettlementDocumentKind
  onCancel: () => void
  onWriteConsent: () => void
  cancelLabel?: string
  /** 설명문 덮어쓰기 — 기본값: variant별 미작성 안내. 제출 시 서버 RECEIPT_PRE_CONSENT_REQUIRED 재사용 등 */
  description?: string
}

export {
  PAYMENT_STATEMENT_PRE_CONSENT_MODAL_DESCRIPTION,
  PAYMENT_STATEMENT_PRE_CONSENT_MODAL_TITLE,
  RECEIPT_PRE_CONSENT_MODAL_DESCRIPTION,
  RECEIPT_PRE_CONSENT_MODAL_TITLE,
  settlementPreConsentModalCopy,
} from '../lib/settlement-pre-consent-copy'

export function PaymentStatementPreConsentModal({
  open,
  variant = 'receipt',
  onCancel,
  onWriteConsent,
  cancelLabel = '취소',
  description,
}: PaymentStatementPreConsentModalProps) {
  const copy = settlementPreConsentModalCopy(variant)
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
            {copy.title}
          </PFText>
          <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.description}>
            {description ?? copy.description}
          </PFText>
        </div>
        <div className={styles.actions}>
          <PFButton type="button" variant="secondary" size="xlarge" onClick={onCancel}>
            {cancelLabel}
          </PFButton>
          <PFButton type="button" variant="primary" size="xlarge" onClick={onWriteConsent}>
            동의서 작성하기
          </PFButton>
        </div>
      </div>
    </PFModal>
  )
}
