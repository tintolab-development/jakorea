import type {
  AgreementSystemBodyDisplayMode,
  SystemParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import { PAYMENT_STATEMENT_PRE_CONSENT_IDS } from '@/features/template/model/payment-statement-pre-consent-draft'
import { PaymentPreConsentFixedBlock } from '@/features/template/ui/paragraph/explanation/payment-pre-consent-fixed-block'
import '@/features/template/ui/form-editor/form-editor.css'
import './explanation-system.css'

const AUTHORING_DATE_LABEL = 'YYYY년 MM월 DD일'
const AUTHORING_SIGNATURE_LABEL = '동의자 (서명)'

function isPaymentStatementPreConsentSheetBarSystemParagraph(p: SystemParagraph): boolean {
  return (
    p.id === PAYMENT_STATEMENT_PRE_CONSENT_IDS.midDate ||
    p.id === PAYMENT_STATEMENT_PRE_CONSENT_IDS.midSignature ||
    p.id === PAYMENT_STATEMENT_PRE_CONSENT_IDS.tailDate ||
    p.id === PAYMENT_STATEMENT_PRE_CONSENT_IDS.tailSignature
  )
}

export function formatKoreanFullDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}년 ${m}월 ${day}일`
}

/** 설명글·기타형 — `systemPreset`이 동의 고정 항목일 때만 본문 슬롯 렌더 */
export function ExplanationSystem({
  paragraph,
  displayMode = 'authoring',
  participantName,
  now,
}: {
  paragraph: SystemParagraph
  onChange: (next: SystemParagraph) => void
  isEditMode: boolean
  displayMode?: AgreementSystemBodyDisplayMode
  /** write·document 모드 서명란 — 사용자 이름 */
  participantName?: string
  /** write·document 모드 날짜(미주입 시 `new Date()`) */
  now?: Date
}) {
  const preset = paragraph.systemPreset
  if (preset !== 'agreement_date' && preset !== 'agreement_signature') {
    return null
  }

  const trimmedName = (participantName ?? '').trim()
  const resolvedNow = now ?? new Date()
  /**
   * authoring(템플릿 편집): YYYY placeholder.
   * write / document(미리보기·fill): 실제 연·월·일 동기화.
   */
  const bodyText =
    preset === 'agreement_date'
      ? displayMode === 'authoring'
        ? AUTHORING_DATE_LABEL
        : formatKoreanFullDate(resolvedNow)
      : displayMode === 'write'
        ? `동의자 : ${trimmedName || '(작성자)'} (서명)`
        : AUTHORING_SIGNATURE_LABEL

  /**
   * document 서명 스펙: 동의자(24/#000) + gap 120px + (서명)(20/#666)
   * 이름 있으면 가운데 슬롯에 표시(폭 120px로 갭 대체)
   */
  const documentSignatureBody =
    preset === 'agreement_signature' && displayMode === 'document' ? (
      <div
        className={[
          'explanation-system-signature-document',
          trimmedName ? 'explanation-system-signature-document--with-name' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <span className="explanation-system-signature-document__label">동의자</span>
        {trimmedName ? (
          <span className="explanation-system-signature-document__name">
            <span className="explanation-system-signature-document__participant">{trimmedName}</span>
          </span>
        ) : null}
        <span className="explanation-system-signature-document__mark">(서명)</span>
      </div>
    ) : null

  const usePreConsentSheetBar = isPaymentStatementPreConsentSheetBarSystemParagraph(paragraph)
  const isDocument = displayMode === 'document'
  const documentModifier =
    isDocument && preset === 'agreement_date'
      ? 'explanation-system--document-date'
      : isDocument && preset === 'agreement_signature'
        ? 'explanation-system--document-signature'
        : ''

  /** 작성 시트만 disabled pill. A4 `document`는 다른 동의서와 동일 우측정렬 텍스트 */
  if (usePreConsentSheetBar && !isDocument) {
    return (
      <div style={{ display: 'contents' }}>
        <div className="explanation-system-row">
          <PaymentPreConsentFixedBlock tone="disabled">{bodyText}</PaymentPreConsentFixedBlock>
        </div>
      </div>
    )
  }

  return (
    <div
      className={[
        'form-editor-body',
        isDocument ? 'explanation-system--document' : '',
        documentModifier,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="explanation-system-row">
        <div className="explanation-system-pill">{documentSignatureBody ?? bodyText}</div>
      </div>
    </div>
  )
}
