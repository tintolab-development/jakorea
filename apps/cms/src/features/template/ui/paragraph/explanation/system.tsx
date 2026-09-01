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

function formatKoreanFullDate(d: Date): string {
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
  const bodyText =
    preset === 'agreement_date'
      ? displayMode === 'write' || displayMode === 'document'
        ? formatKoreanFullDate(now ?? new Date())
        : AUTHORING_DATE_LABEL
      : displayMode === 'write'
        ? `동의자 : ${trimmedName || '(작성자)'} (서명)`
        : AUTHORING_SIGNATURE_LABEL

  const documentSignatureBody =
    preset === 'agreement_signature' && displayMode === 'document' ? (
      <div className="explanation-system-signature-document">
        <span className="explanation-system-signature-document__label">동의자</span>
        <span className="explanation-system-signature-document__name">
          {trimmedName ? (
            <span className="explanation-system-signature-document__participant">{trimmedName}</span>
          ) : null}
        </span>
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

  if (usePreConsentSheetBar) {
    const barClass =
      displayMode === 'document' ? 'payment-pre-consent-fixed-block--document' : undefined
    const useDocumentSignatureLayout =
      preset === 'agreement_signature' && displayMode === 'document' && documentSignatureBody != null
    /* 작성 모드: `form-editor-body` 래퍼는 슬롯·리스트 gap과 여백이 겹쳐 보이므로 layout에서 제외(display: contents).
       문서 모드: `.explanation-system--document` 조상은 인쇄용 스타일에 필요 */
    return (
      <div
        className={
          isDocument
            ? ['explanation-system--document', documentModifier].filter(Boolean).join(' ')
            : undefined
        }
        style={!isDocument ? { display: 'contents' } : undefined}
      >
        <div className="explanation-system-row">
          <PaymentPreConsentFixedBlock tone="disabled" className={barClass}>
            {useDocumentSignatureLayout ? documentSignatureBody : bodyText}
          </PaymentPreConsentFixedBlock>
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
