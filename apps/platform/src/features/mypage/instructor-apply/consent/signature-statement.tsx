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
    /** 회원이 아닌 서명자(보호자) — 회원 전자서명을 불러오지 않고 이 칸에서 새로 서명 */
    independentSigner?: boolean
    /** 서명 블록 위 안내 (예: 보호자 서명란은 보호자님이 직접 서명해 주세요.) */
    signerNotice?: string
  }
>(function ConsentSignatureStatement(
  {
    statement,
    note,
    signerName,
    signature,
    onSignatureChange,
    showSignatureBlock = true,
    independentSigner = false,
    signerNotice,
  },
  ref,
) {
  const trimmedNote = note?.trim() ?? ''
  const trimmedNotice = signerNotice?.trim() ?? ''
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
        <>
          {trimmedNotice ? <p className={styles.statementNote}>{trimmedNotice}</p> : null}
          <PFFormSignatureBlock
            ref={ref}
            className={styles.statementSignatureBlock}
            signerName={signerName}
            signature={signature}
            onSignatureChange={onSignatureChange}
            independentSigner={independentSigner}
          />
        </>
      ) : null}
    </section>
  )
})
