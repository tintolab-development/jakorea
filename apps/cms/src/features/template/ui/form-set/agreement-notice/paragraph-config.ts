import type { RenderFormParagraphBodyOptions } from '@/features/template/ui/paragraph/renderers/render-form-paragraph-body'

/**
 * 행정정보 공동이용 사전 동의 — 템플릿 authoring은 확인 문구·날짜·서명을 시안처럼 분리.
 * 회원 fill 2단 확인 카드는 `buildAgreementConsentFillParagraphBodyOptions`에서 켠다.
 */
export const AGREEMENT_NOTICE_PARAGRAPH_BODY_OPTIONS = {
  /** A4·시안: 서명란은 빈 밑줄. 회원 fill은 `buildAgreementConsentFillParagraphBodyOptions`에서 이름 주입 */
  structureLockedAuthoringChoicePreview: true,
} satisfies RenderFormParagraphBodyOptions
