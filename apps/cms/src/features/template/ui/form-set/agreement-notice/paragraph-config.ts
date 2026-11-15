import { getAgreementNoticeAdminProxyHiddenIds } from '@/features/template/lib/agreement-admin-proxy-confirm-paragraphs'
import { AGREEMENT_NOTICE_PARAGRAPH_IDS } from '@/features/template/model/writing-form-draft.schema'
import { AGREEMENT_NOTICE_A4_PREVIEW_BODY_CLASS_NAME } from '@/features/template/model/agreement-notice-a4-preview'
import type { RenderFormParagraphBodyOptions } from '@/features/template/ui/paragraph/renderers/render-form-paragraph-body'

/** 행정정보 공동이용 사전 동의 — 확인 단락을 공통 2단 카드(문구·날짜 / 안내·성명)로 */
export const AGREEMENT_NOTICE_PARAGRAPH_BODY_OPTIONS = {
  agreementAdminProxyConfirm: true,
  /** confirmationClosing에 날짜·성명 합침 — systemDate/systemSignature 숨김 */
  hiddenParagraphIds: getAgreementNoticeAdminProxyHiddenIds(),
  /** 템플릿 authoring 미리보기용 샘플 이름 (회원 fill에서는 participantName으로 덮어씀) */
  agreementSystemParticipantName: '이름예시',
  structureLockedAuthoringChoicePreview: true,
  /** A4 미리보기 전용 스코프 — 작성 화면 대리동의 카드는 유지 */
  documentPreviewClassName: AGREEMENT_NOTICE_A4_PREVIEW_BODY_CLASS_NAME,
} satisfies RenderFormParagraphBodyOptions

/**
 * 템플릿 관리 작성 화면 전용 — 시안 5767:41434.
 * 대리 확인 2단 카드(회원 대리 동의용) 대신 흰 확인 문구 카드·회색 날짜·서명 카드를 따로 보인다.
 */
const {
  agreementAdminProxyConfirm: _proxyConfirm,
  hiddenParagraphIds: _proxyHiddenIds,
  ...sheetLayoutBaseOptions
} = AGREEMENT_NOTICE_PARAGRAPH_BODY_OPTIONS

export const AGREEMENT_NOTICE_TEMPLATE_MANAGEMENT_PARAGRAPH_BODY_OPTIONS = {
  ...sheetLayoutBaseOptions,
  agreementConfirmSheetLayout: true,
} satisfies RenderFormParagraphBodyOptions

/**
 * 우측 「커스텀 필드」 목록 — 시안은 「5. 대상자 본인」까지만 보인다.
 * 5번 카드 하단 안내·확인 문구·날짜·서명은 목록에서 뺀다(캔버스에는 보인다).
 */
export const AGREEMENT_NOTICE_TEMPLATE_MANAGEMENT_NAV_HIDDEN_IDS: ReadonlySet<string> = new Set([
  ...getAgreementNoticeAdminProxyHiddenIds(),
  AGREEMENT_NOTICE_PARAGRAPH_IDS.subjectNote,
  AGREEMENT_NOTICE_PARAGRAPH_IDS.confirmationClosing,
])
