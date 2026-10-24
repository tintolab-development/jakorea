import { getEducatorFacilitatorPledgeAdminProxyHiddenIds } from '@/features/template/lib/agreement-admin-proxy-confirm-paragraphs'
import { AGREEMENT_EXPENSE_A4_PREVIEW_BODY_CLASS_NAME } from '@/features/template/model/agreement-expense-a4-preview'
import type { RenderFormParagraphBodyOptions } from '@/features/template/ui/paragraph/renderers/render-form-paragraph-body'

/** 교육진행자 동의 서약서 — 위반 동의 단락을 공통 2단 카드(문구·날짜 / 안내·성명)로 */
export const EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_BODY_OPTIONS = {
  agreementAdminProxyConfirm: true,
  /** violationClosing에 날짜·성명 합침 — systemDate/systemSignature 숨김 */
  hiddenParagraphIds: getEducatorFacilitatorPledgeAdminProxyHiddenIds(),
  /** 템플릿 authoring 미리보기용 샘플 이름 (회원 fill에서는 participantName으로 덮어씀) */
  agreementSystemParticipantName: '홍길동',
  structureLockedAuthoringChoicePreview: true,
  /** A4 미리보기 전용 스코프 — 작성 화면 대리동의 카드는 유지 */
  documentPreviewClassName: AGREEMENT_EXPENSE_A4_PREVIEW_BODY_CLASS_NAME,
} satisfies RenderFormParagraphBodyOptions
