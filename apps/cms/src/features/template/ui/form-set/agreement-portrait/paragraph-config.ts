import { getAgreementPortraitAdminProxyHiddenIds } from '@/features/template/lib/agreement-admin-proxy-confirm-paragraphs'
import type { RenderFormParagraphBodyOptions } from '@/features/template/ui/paragraph/renderers/render-form-paragraph-body'

/** 초상권 수집·이용 동의 — 확인 단락을 공통 2단 카드(문구·날짜 / 안내·성명)로 */
export const AGREEMENT_PORTRAIT_PARAGRAPH_BODY_OPTIONS = {
  agreementAdminProxyConfirm: true,
  /** confirmationClosing에 날짜·성명 합침 — systemDate/systemSignature 숨김 */
  hiddenParagraphIds: getAgreementPortraitAdminProxyHiddenIds(),
  /** 템플릿 authoring 미리보기용 샘플 이름 (회원 fill에서는 participantName으로 덮어씀) */
  agreementSystemParticipantName: '홍길동',
  structureLockedAuthoringChoicePreview: true,
} satisfies RenderFormParagraphBodyOptions
