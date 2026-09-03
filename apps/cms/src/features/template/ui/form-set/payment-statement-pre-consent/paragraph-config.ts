import { PAYMENT_STATEMENT_PRE_CONSENT_BASIC_INFO_AUTHORING_VALUES } from '@/features/template/model/payment-statement-basic-info-sample'
import { PAYMENT_STATEMENT_PRE_CONSENT_IDS } from '@/features/template/model/payment-statement-pre-consent-draft'
import type { RenderFormParagraphBodyOptions } from '@/features/template/ui/paragraph/renderers/render-form-paragraph-body'

export const PAYMENT_STATEMENT_PRE_CONSENT_HIDDEN_DRAG_HANDLE_IDS = new Set<string>([
  PAYMENT_STATEMENT_PRE_CONSENT_IDS.title,
  PAYMENT_STATEMENT_PRE_CONSENT_IDS.midConsentLine,
  PAYMENT_STATEMENT_PRE_CONSENT_IDS.midDate,
  PAYMENT_STATEMENT_PRE_CONSENT_IDS.midSignature,
  PAYMENT_STATEMENT_PRE_CONSENT_IDS.finalConfirm,
  PAYMENT_STATEMENT_PRE_CONSENT_IDS.tailDate,
  PAYMENT_STATEMENT_PRE_CONSENT_IDS.tailSignature,
  PAYMENT_STATEMENT_PRE_CONSENT_IDS.closingRecipient,
])

/**
 * 템플릿 authoring — 시안처럼 mid/tail 확인 문구·날짜·서명을 **분리** 노출.
 * 회원 fill의 2단 확인 카드는 `buildAgreementConsentFillParagraphBodyOptions`에서 켠다.
 */
export const PAYMENT_STATEMENT_PRE_CONSENT_PARAGRAPH_BODY_OPTIONS = {
  /** 샘플 회원값 없이 placeholder만 노출 (지급 목적만 고정) */
  paymentStatementBasicInfoValues: PAYMENT_STATEMENT_PRE_CONSENT_BASIC_INFO_AUTHORING_VALUES,
  paymentStatementBasicInfoOnlyPaymentPurposeLocked: true,
  /** 구조 잠금 단락도 하단 동의 라디오는 카드 비선택 시 조작 가능(회원 fill과 동일) */
  structureLockedAuthoringChoicePreview: true,
  /** closingRecipient는 공통 AgreementSheetClosingFooter로 대체 */
  hiddenParagraphIds: new Set([PAYMENT_STATEMENT_PRE_CONSENT_IDS.closingRecipient]),
  /** A4·시안: 서명란은 빈 밑줄. 회원 fill은 `buildAgreementConsentFillParagraphBodyOptions`에서 이름 주입 */
} satisfies RenderFormParagraphBodyOptions
