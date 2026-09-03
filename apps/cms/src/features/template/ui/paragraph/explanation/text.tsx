import type {
  AgreementExplanationTextParagraph,
  TableBottomConsent,
} from '@/features/template/model/writing-form-draft.schema'
import { PAYMENT_STATEMENT_PRE_CONSENT_IDS } from '@/features/template/model/payment-statement-pre-consent-draft'
import { PaymentPreConsentFixedBlock } from '@/features/template/ui/paragraph/explanation/payment-pre-consent-fixed-block'
import { ParagraphInput } from '@/features/template/ui/shared/paragraph-input'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { resolveTableBottomConsentRadioValue } from '@/features/template/lib/resolve-table-bottom-consent-radio-value'
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
  consentFillMode = false,
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
  /** 동의서 작성(fill) — bottomConsent 미선택 시 agree 폴백 금지 */
  consentFillMode?: boolean
}) {
  const consentInteractive = bottomConsentInteractive ?? isEditMode
  /** 초상권 intro는 구 저장본에 필드가 없어도 하단 동의 라디오 필수 */
  const showBottomConsent =
    paragraph.showBottomConsent === true || paragraph.id === 'agreement-portrait-intro'

  const consentRadios = showBottomConsent ? (
    <CmsRadioGroup
      className="form-editor-table-bottom-consent"
      size="large"
      value={resolveTableBottomConsentRadioValue(paragraph.bottomConsent, {
        consentFillMode,
        interactive: consentInteractive,
      })}
      onChange={e => {
        if (!consentInteractive) return
        onChange({
          ...paragraph,
          bottomConsent: e.target.value as TableBottomConsent,
        })
      }}
      disabled={!consentInteractive}
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
      /* 지급조서 mid/final 확인 — disabled pill(시안 고정 단락) */
      return (
        <>
          <PaymentPreConsentFixedBlock tone="disabled">{text}</PaymentPreConsentFixedBlock>
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
    const text = typeof paragraph.bodyText === 'string' ? paragraph.bodyText : ''
    return (
      <div className="form-editor-body explanation-text">
        <CmsInput
          className="explanation-text__disabled-input"
          inputSize="large"
          width="100%"
          value={text}
          disabled
          allowClear={false}
        />
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
