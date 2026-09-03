import type { RenderFormParagraphBodyOptions } from '@/features/template/ui/paragraph/renderers/render-form-paragraph-body'
import { AGREEMENT_PORTRAIT_A4_PREVIEW_BODY_CLASS_NAME } from '@/features/template/model/agreement-portrait-a4-preview'

/**
 * 초상권 수집·이용 동의 — 템플릿 authoring은 확인 문구·날짜·서명을 시안처럼 분리.
 * 회원 fill 2단 확인 카드는 `buildAgreementConsentFillParagraphBodyOptions`에서 켠다.
 */
export const AGREEMENT_PORTRAIT_PARAGRAPH_BODY_OPTIONS = {
  structureLockedAuthoringChoicePreview: true,
  /** A4 미리보기 1페이지 — 확인·표·서명 스택 패딩/갭 축소 */
  documentPreviewClassName: AGREEMENT_PORTRAIT_A4_PREVIEW_BODY_CLASS_NAME,
} satisfies RenderFormParagraphBodyOptions
