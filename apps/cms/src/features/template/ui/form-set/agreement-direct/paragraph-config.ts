import { getDirectAgreementAdminProxyHiddenIds } from '@/features/template/lib/agreement-admin-proxy-confirm-paragraphs'
import type { RenderFormParagraphBodyOptions } from '@/features/template/ui/paragraph/renderers/render-form-paragraph-body'

/** 직접 등록 신규 동의 — 마무리 문구·날짜·서명을 공통 2단 확인 카드로 */
export const DIRECT_AGREEMENT_PARAGRAPH_BODY_OPTIONS = {
  agreementAdminProxyConfirm: true,
  hiddenParagraphIds: getDirectAgreementAdminProxyHiddenIds(),
  agreementSystemParticipantName: '홍길동',
} satisfies RenderFormParagraphBodyOptions
