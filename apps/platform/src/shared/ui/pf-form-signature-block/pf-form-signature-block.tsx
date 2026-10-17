import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react'
import { PFButton } from '../pf-button'
import {
  PFElectronicSignatureEditConfirm,
  PFElectronicSignatureModal,
  SIGNATURE_FONT_STYLES,
} from '../pf-electronic-signature-modal'
import { ensureSignatureFontsReady } from '../pf-electronic-signature-modal/signature-fonts'
import { usePFFormDraftSignatureOptional } from '../pf-form-draft-signature'
import {
  createFormSignatureValue,
  formatFormSignatureDate,
  normalizeFormSignatureValue,
} from './normalize-form-signature'
import styles from './pf-form-signature-block.module.css'
import type { PFFormSignatureBlockHandle, PFFormSignatureBlockProps } from './types'

function formatConsentDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}년 ${month}월 ${day}일`
}

function resolveSignatureFontStyle(fontStyleCode?: string) {
  if (!fontStyleCode) return null
  return SIGNATURE_FONT_STYLES.find(style => style.code === fontStyleCode) ?? null
}

/** Platform 양식 공통 — 날짜 · 성명 · 전자서명(서명하기 / 서명 완료) */
export const PFFormSignatureBlock = forwardRef<
  PFFormSignatureBlockHandle,
  PFFormSignatureBlockProps
>(function PFFormSignatureBlock(
  { signerName, signature, onSignatureChange, className, contentAlign = 'center' },
  ref,
) {
  const [signOpen, setSignOpen] = useState(false)
  const [editConfirmOpen, setEditConfirmOpen] = useState(false)
  const draftSignature = usePFFormDraftSignatureOptional()
  /** 제목 행 전자서명 Provider — 본문 칸에서는 서명 후 수정 불가(제목에서만 수정) */
  const bodyEditLocked = draftSignature != null
  const storedSignature = useMemo(() => normalizeFormSignatureValue(signature), [signature])
  const signed = storedSignature != null

  const signDateLabel = signed
    ? formatFormSignatureDate(storedSignature)
    : formatConsentDate(new Date())

  const fontStyle = resolveSignatureFontStyle(storedSignature?.fontStyleCode)
  const signatureLabel =
    storedSignature?.displayName?.trim() ||
    (storedSignature?.mode === 'create' ? signerName : '')

  useEffect(() => {
    if (fontStyle) void ensureSignatureFontsReady()
  }, [fontStyle])

  const handleUnsignedSign = useCallback(() => {
    if (draftSignature) {
      const profile = draftSignature.getDraftProfile()
      if (profile) {
        onSignatureChange(draftSignature.cloneProfileForApply(profile))
        return
      }
      draftSignature.openCreate({
        applyToSlot: stamped => onSignatureChange(stamped),
      })
      return
    }
    setSignOpen(true)
  }, [draftSignature, onSignatureChange])

  useImperativeHandle(
    ref,
    () => ({
      requestEdit: () => {
        if (signed) {
          if (!bodyEditLocked) setEditConfirmOpen(true)
          return
        }
        handleUnsignedSign()
      },
    }),
    [bodyEditLocked, handleUnsignedSign, signed],
  )

  return (
    <section
      className={[
        styles.card,
        contentAlign === 'end' ? styles.cardContentEnd : undefined,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={styles.signBlock}>
        <div
          className={[
            styles.signer,
            contentAlign === 'end' ? styles.signerAlignEnd : undefined,
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <span className={styles.signDate}>{signDateLabel}</span>
          <span className={styles.signNameRow}>
            <span className={styles.signName}>{signerName}</span>
            {signed ? (
              <span className={styles.signParen}>
                <span aria-hidden>(</span>
                {fontStyle && signatureLabel ? (
                  <span
                    className={styles.signFontMark}
                    style={{ fontFamily: fontStyle.family, fontWeight: fontStyle.weight }}
                  >
                    {signatureLabel}
                  </span>
                ) : (
                  <img
                    className={styles.signImage}
                    src={storedSignature.dataUrl}
                    alt={`${signerName} 전자서명`}
                  />
                )}
                <span aria-hidden>)</span>
              </span>
            ) : (
              <span className={styles.signMark}>( 서 명 )</span>
            )}
          </span>
        </div>
        {!signed || !bodyEditLocked ? (
          <PFButton
            size="xlarge"
            variant={signed ? 'tertiary' : 'secondary'}
            className={styles.signButton}
            onClick={() => (signed ? setEditConfirmOpen(true) : handleUnsignedSign())}
          >
            {signed ? '전자서명 수정하기' : '서명하기'}
          </PFButton>
        ) : null}
      </div>

      {!bodyEditLocked ? (
        <>
          <PFElectronicSignatureModal
            open={signOpen}
            onClose={() => setSignOpen(false)}
            onSign={result => onSignatureChange(createFormSignatureValue(result))}
          />
          <PFElectronicSignatureEditConfirm
            open={editConfirmOpen}
            onCancel={() => setEditConfirmOpen(false)}
            onConfirm={() => {
              setEditConfirmOpen(false)
              setSignOpen(true)
            }}
          />
        </>
      ) : null}
    </section>
  )
})
