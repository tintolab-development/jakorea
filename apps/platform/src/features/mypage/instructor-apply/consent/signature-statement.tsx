import { useState } from 'react'
import {
  PFButton,
  PFElectronicSignatureEditConfirm,
  PFElectronicSignatureModal,
} from '@/shared/ui'
import styles from './consent-form.module.css'

function formatConsentDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}년 ${month}월 ${day}일`
}

/** 동의 확인·수령 확인 등 — 진술문 + 작성일(접속 당일) · 성명 · 전자서명 */
export function ConsentSignatureStatement({
  statement,
  signerName,
  signatureDataUrl,
  onSignatureChange,
}: {
  statement: string
  signerName: string
  signatureDataUrl: string
  onSignatureChange: (dataUrl: string) => void
}) {
  const [signOpen, setSignOpen] = useState(false)
  const [editConfirmOpen, setEditConfirmOpen] = useState(false)
  const signed = Boolean(signatureDataUrl)

  return (
    <section className={styles.statementCard}>
      <p className={styles.statementText}>{statement}</p>

      <div className={styles.signBlock}>
        <div className={styles.signer}>
          <span className={styles.signDate}>{formatConsentDate(new Date())}</span>
          <span className={styles.signNameRow}>
            <span className={styles.signName}>{signerName}</span>
            {signed ? (
              <img
                className={styles.signImage}
                src={signatureDataUrl}
                alt={`${signerName} 전자서명`}
              />
            ) : (
              <span className={styles.signMark}>( 서 명 )</span>
            )}
          </span>
        </div>
        <PFButton
          size="xlarge"
          variant="primary"
          className={styles.signButton}
          onClick={() => (signed ? setEditConfirmOpen(true) : setSignOpen(true))}
        >
          서명하기
        </PFButton>
      </div>

      <PFElectronicSignatureModal
        open={signOpen}
        onClose={() => setSignOpen(false)}
        onSign={result => onSignatureChange(result.dataUrl)}
      />
      <PFElectronicSignatureEditConfirm
        open={editConfirmOpen}
        onCancel={() => setEditConfirmOpen(false)}
        onConfirm={() => {
          setEditConfirmOpen(false)
          setSignOpen(true)
        }}
      />
    </section>
  )
}
