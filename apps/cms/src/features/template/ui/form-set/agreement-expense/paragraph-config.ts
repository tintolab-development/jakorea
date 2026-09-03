import type { RenderFormParagraphBodyOptions } from '@/features/template/ui/paragraph/renderers/render-form-paragraph-body'

/**
 * 교육진행자 동의 서약서 — 템플릿 authoring은 위반 동의·날짜·서명을 시안처럼 분리.
 * 회원 fill 2단 확인 카드는 `buildAgreementConsentFillParagraphBodyOptions`에서 켠다.
 */
export const EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_BODY_OPTIONS = {
  /** A4·시안: 서명란은 빈 밑줄. 회원 fill은 `buildAgreementConsentFillParagraphBodyOptions`에서 이름 주입 */
  structureLockedAuthoringChoicePreview: true,
} satisfies RenderFormParagraphBodyOptions
