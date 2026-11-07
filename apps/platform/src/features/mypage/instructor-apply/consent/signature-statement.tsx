import { forwardRef } from 'react'
import {
  PFFormSignatureBlock,
  type FormSignatureValue,
  type PFFormSignatureBlockHandle,
} from '@/shared/ui'
import styles from './consent-form.module.css'

/** 동의 확인·수령 확인 등 — 진술문 + 작성일(접속 당일) · 성명 · 전자서명 */
export const ConsentSignatureStatement = forwardRef<
  PFFormSignatureBlockHandle,
  {
    statement: string
    /** 확인문 아래 회색 안내(서약서 유효·보관 기간 등) */
    note?: string
    signerName: string
    signature?: string | FormSignatureValue | null
    onSignatureChange: (value: FormSignatureValue) => void
    /** false면 진술문만 — 서명 블록은 양식 서명란 단락 위치에 따로 렌더 */
    showSignatureBlock?: boolean
  }
>(function ConsentSignatureStatement(
  { statement, note, signerName, signature, onSignatureChange, showSignatureBlock = true },
  ref,
) {
  const trimmedNote = note?.trim() ?? ''
  return (
    <section className={styles.statementCard}>
      {trimmedNote ? (
        <div className={styles.statementTextGroup}>
          <p className={styles.statementText}>{statement}</p>
          <p className={styles.statementNote}>{trimmedNote}</p>
        </div>
      ) : (
        <p className={styles.statementText}>{statement}</p>
      )}
      {showSignatureBlock ? (
        <PFFormSignatureBlock
          ref={ref}
          className={styles.statementSignatureBlock}
          signerName={signerName}
          signature={signature}
          onSignatureChange={onSignatureChange}
        />
      ) : null}
    </section>
  )
})
