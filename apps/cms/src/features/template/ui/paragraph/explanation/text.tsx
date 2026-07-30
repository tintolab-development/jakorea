import type {
  AgreementExplanationTextParagraph,
  TableBottomConsent,
} from '@/features/template/model/writing-form-draft.schema'
import { PAYMENT_STATEMENT_PRE_CONSENT_IDS } from '@/features/template/model/payment-statement-pre-consent-draft'
import { PaymentPreConsentFixedBlock } from '@/features/template/ui/paragraph/explanation/payment-pre-consent-fixed-block'
import { ParagraphInput } from '@/features/template/ui/shared/paragraph-input'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import '@/features/template/ui/form-editor/form-editor.css'
import './text.css'

export type ExplanationTextBodyDisplayMode = 'input' | 'disabled-placeholder' | 'static-body'

/** 설명글_텍스트형 — 카드 `title`/`description`은 `ParagraphCard`에서 처리, 슬롯에는 본문(+선택 동의 라디오) */
export function ExplanationText({
  paragraph,
  onChange,
  isEditMode,
  bodyDisplayMode = 'input',
  bottomConsentInteractive,
}: {
  paragraph: AgreementExplanationTextParagraph
  onChange: (next: AgreementExplanationTextParagraph) => void
  isEditMode: boolean
  /** 작성(authoring) + 구조 잠금 단락에서 본문을 Disabled 입력 영역으로 표시 */
  bodyDisplayMode?: ExplanationTextBodyDisplayMode
  /**
   * 하단 동의 라디오 조작 가능 여부.
   * 미지정 시 `isEditMode`와 동일. 구조 잠금 작성 미리체크는 true를 넘긴다.
   */
  bottomConsentInteractive?: boolean
}) {
  const consentInteractive = bottomConsentInteractive ?? isEditMode
  /** 초상권 intro는 구 저장본에 필드가 없어도 하단 동의 라디오 필수 */
  const showBottomConsent =
    paragraph.showBottomConsent === true || paragraph.id === 'agreement-portrait-intro'

  const consentRadios = showBottomConsent ? (
    <CmsRadioGroup
      className="form-editor-table-bottom-consent"
      size="large"
      value={paragraph.bottomConsent ?? 'agree'}
      onChange={e => {
        if (!consentInteractive) return
        onChange({
          ...paragraph,
          bottomConsent: e.target.value as TableBottomConsent,
        })
      }}
      style={consentInteractive ? undefined : { pointerEvents: 'none' }}
    >
      <CmsRadio value="agree">동의</CmsRadio>
      <CmsRadio value="disagree">동의하지 않음</CmsRadio>
    </CmsRadioGroup>
  ) : null

  if (bodyDisplayMode === 'static-body') {
    const text = typeof paragraph.bodyText === 'string' ? paragraph.bodyText : ''
    const isPreConsentWhiteSheetBar =
      paragraph.id === PAYMENT_STATEMENT_PRE_CONSENT_IDS.midConsentLine ||
      paragraph.id === PAYMENT_STATEMENT_PRE_CONSENT_IDS.finalConfirm
    if (isPreConsentWhiteSheetBar) {
      /* `form-editor-body`는 슬롯·고정 블록과 flex gap이 겹칠 수 있어 래퍼 없이 렌더 */
      return (
        <>
          <PaymentPreConsentFixedBlock tone="white">{text}</PaymentPreConsentFixedBlock>
          {consentRadios}
        </>
      )
    }

    return (
      <div className="form-editor-body explanation-text">
        <p className="explanation-text__static-body">{text}</p>
        {consentRadios}
      </div>
    )
  }

  if (bodyDisplayMode === 'disabled-placeholder') {
    const text =
      typeof paragraph.bodyText === 'string' ? paragraph.bodyText.trim() : ''
    return (
      <div className="form-editor-body explanation-text">
        <div
          className="explanation-text__disabled-placeholder"
          aria-disabled="true"
        >
          {text.length > 0 ? (
            <span className="explanation-text__disabled-placeholder-text">{text}</span>
          ) : null}
        </div>
        {consentRadios}
      </div>
    )
  }

  const ph =
    (typeof paragraph.bodyPlaceholder === 'string' ? paragraph.bodyPlaceholder.trim() : '') ||
    '텍스트를 작성해 주세요'

  return (
    <div className="form-editor-body explanation-text">
      <ParagraphInput
        type="description"
        className="paragraph-input--explanation-body"
        isEditMode={isEditMode}
        value={paragraph.bodyText}
        placeholder={ph}
        onChange={
          isEditMode ? next => onChange({ ...paragraph, bodyText: next }) : undefined
        }
      />
      {consentRadios}
    </div>
  )
}
