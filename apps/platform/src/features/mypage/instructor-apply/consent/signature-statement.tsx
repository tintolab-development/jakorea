import {
  PFFormSignatureBlock,
  type FormSignatureValue,
} from '@/shared/ui'
import styles from './consent-form.module.css'

/** 동의 확인·수령 확인 등 — 진술문 + 작성일(접속 당일) · 성명 · 전자서명 */
export function ConsentSignatureStatement({
  statement,
  signerName,
  signature,
  onSignatureChange,
}: {
  statement: string
  signerName: string
  signature?: string | FormSignatureValue | null
  onSignatureChange: (value: FormSignatureValue) => void
}) {
  return (
    <section className={styles.statementCard}>
      <p className={styles.statementText}>{statement}</p>
      <PFFormSignatureBlock
        className={styles.statementSignatureBlock}
        signerName={signerName}
        signature={signature}
        onSignatureChange={onSignatureChange}
      />
    </section>
  )
}
