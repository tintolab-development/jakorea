import {
  AGREEMENT_NOTICE_PARAGRAPH_IDS,
  AGREEMENT_PORTRAIT_PARAGRAPH_IDS,
  EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS,
  type WritingFormParagraph,
} from '@jakorea/form-schema/writing-form'
import { PAYMENT_STATEMENT_PRE_CONSENT_IDS } from '@jakorea/form-schema/paragraph-ids/payment-statement-pre-consent-draft'
import type { ReactNode } from 'react'
import previewTypography from './consent-document-preview-typography.module.css'

const CONFIRM_RULE_IDS = new Set<string>([
  PAYMENT_STATEMENT_PRE_CONSENT_IDS.midConsentLine,
  PAYMENT_STATEMENT_PRE_CONSENT_IDS.finalConfirm,
  EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS.violationClosing,
  AGREEMENT_PORTRAIT_PARAGRAPH_IDS.confirmationClosing,
  AGREEMENT_NOTICE_PARAGRAPH_IDS.confirmationClosing,
])

export type ConsentPreviewChrome = {
  content: ReactNode
  /** 날짜 바로 다음 서명란 — 단락 간격 40px를 10px(초상권 6px)로 줄인다 */
  stack?: 'signature'
  /** 확인 문구·행정정보 날짜 위 구분선 */
  rule?: 'confirm' | 'date'
}

function isDateParagraph(paragraph: WritingFormParagraph): boolean {
  return (
    paragraph.kind === 'description' &&
    paragraph.variant === 'system' &&
    paragraph.systemPreset === 'agreement_date'
  )
}

function isSignatureParagraph(paragraph: WritingFormParagraph): boolean {
  return (
    paragraph.kind === 'description' &&
    paragraph.variant === 'system' &&
    paragraph.systemPreset === 'agreement_signature'
  )
}

function confirmText(paragraph: WritingFormParagraph): string {
  if (paragraph.kind === 'description' && paragraph.variant === 'closing') {
    return paragraph.body?.trim() ?? ''
  }
  if (paragraph.kind === 'single_item' && paragraph.variant === 'agreement_explanation_text') {
    return paragraph.bodyText?.trim() ?? ''
  }
  return ''
}

function ConsentPreviewDate({ label }: { label: string }) {
  return <p className={previewTypography.previewDate}>{label}</p>
}

function ConsentPreviewSignature({
  signerName,
  signatureImageSrc,
}: {
  signerName?: string
  signatureImageSrc?: string
}) {
  const name = signerName?.trim() ?? ''
  const imageSrc = signatureImageSrc?.trim() ?? ''
  return (
    <div
      className={[
        previewTypography.previewSignature,
        name ? previewTypography.previewSignatureWithName : undefined,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className={previewTypography.previewSignatureLabel}>동의자</span>
      {name ? <span className={previewTypography.previewSignatureName}>{name}</span> : null}
      {imageSrc ? (
        <img className={previewTypography.previewSignatureImage} src={imageSrc} alt="전자서명" />
      ) : (
        <span className={previewTypography.previewSignatureMark}>(서명)</span>
      )}
    </div>
  )
}

function ConsentPreviewConfirmText({ text }: { text: string }) {
  return <p className={previewTypography.previewConfirm}>{text}</p>
}

export function ConsentPreviewRecipient() {
  return <p className={previewTypography.previewRecipient}>JA KOREA 귀하</p>
}

/**
 * A4 동의서 확인 — 날짜·동의자 (서명)·확인 문구.
 * 해당 단락이 아니면 null (기존 본문 렌더).
 */
export function resolveConsentDocumentPreviewChrome(
  paragraph: WritingFormParagraph,
  nextParagraph: WritingFormParagraph | undefined,
  submittedDateLabel: string,
  signature?: { signerName?: string; signatureImageSrc?: string },
  options?: { noticeClosingVisible?: boolean },
): ConsentPreviewChrome | null {
  if (isDateParagraph(paragraph)) {
    return {
      content: <ConsentPreviewDate label={submittedDateLabel} />,
      rule:
        paragraph.id === AGREEMENT_NOTICE_PARAGRAPH_IDS.systemDate &&
        options?.noticeClosingVisible !== true
          ? 'date'
          : undefined,
    }
  }

  if (isSignatureParagraph(paragraph)) {
    return {
      content: (
        <ConsentPreviewSignature
          signerName={signature?.signerName}
          signatureImageSrc={signature?.signatureImageSrc}
        />
      ),
      stack: 'signature',
    }
  }

  const text = confirmText(paragraph)
  const isClosing = paragraph.kind === 'description' && paragraph.variant === 'closing'
  const isUntitledExplanationBeforeDate =
    paragraph.kind === 'single_item' &&
    paragraph.variant === 'agreement_explanation_text' &&
    (paragraph.paragraphTitle?.trim().length ?? 0) === 0 &&
    nextParagraph != null &&
    isDateParagraph(nextParagraph)

  if (paragraph.id === PAYMENT_STATEMENT_PRE_CONSENT_IDS.closingRecipient) return null
  if (
    isClosing &&
    paragraph.id === AGREEMENT_NOTICE_PARAGRAPH_IDS.confirmationClosing
  ) {
    return {
      content: text ? <ConsentPreviewConfirmText text={text} /> : null,
      rule: 'confirm',
    }
  }
  if (!text || (!isClosing && !isUntitledExplanationBeforeDate)) return null

  return {
    content: <ConsentPreviewConfirmText text={text} />,
    rule: CONFIRM_RULE_IDS.has(paragraph.id) ? 'confirm' : undefined,
  }
}
