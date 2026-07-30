import {
  AGREEMENT_ADMIN_PROXY_CONFIRM_TEMPLATE_IDS,
  resolveAgreementAdminProxyConfirmHiddenIds,
} from '@/features/template/lib/agreement-admin-proxy-confirm-paragraphs'
import type { AgreementWritingFormConfig } from '@/features/template/model/template-registry/agreement-template-config-registry'
import type { RenderFormParagraphBodyOptions } from '@/features/template/ui/paragraph/renderers/render-form-paragraph-body'
import type { ParagraphBodyInteractionMode } from '@/features/template/ui/paragraph/renderers/paragraph-body-interaction-mode'

export type AgreementConsentFillContext = {
  templateId: string
  /** write 모드 서명란 */
  participantName?: string
  /** 초상권 동의서 소속 셀렉트 고정 옵션 */
  portraitAffiliationSelectOptions?: ReadonlyArray<{ value: string; label: string }>
}

/** 회원관리(등록·상세) 동의서 작성 — user 모드 + 양식 본문만 잠금 */
export function resolveAgreementConsentFillInteractionMode(
  _templateId?: string
): ParagraphBodyInteractionMode {
  return 'user'
}

/**
 * 회원·강사 등록/상세 — 동의서 작성 모달 본문 옵션.
 * - 양식(동의 문구·표 셀)은 `agreementConsentFillReadOnlyBody`로 잠금
 * - 응답 작성(지급조서 기본정보, 하단 동의 라디오, 초상권 성명·소속)은 입력 가능
 */
export function buildAgreementConsentFillParagraphBodyOptions(
  agreementConfig: AgreementWritingFormConfig | null | undefined,
  context?: AgreementConsentFillContext
): RenderFormParagraphBodyOptions | undefined {
  if (agreementConfig == null) return undefined

  const templateId = context?.templateId ?? ''
  const baseOptions = agreementConfig.paragraphBodyOptions
  const hasParticipantName = (context?.participantName?.trim().length ?? 0) > 0
  const templateSupportsProxyConfirm = AGREEMENT_ADMIN_PROXY_CONFIRM_TEMPLATE_IDS.has(templateId)
  /** 템플릿 authoring에서 쓰는 2단 확인 카드 — 지급조서 등은 paragraphBodyOptions 플래그를 그대로 따른다 */
  const isAdminProxyConfirm =
    baseOptions?.agreementAdminProxyConfirm === true ||
    (templateSupportsProxyConfirm && hasParticipantName)

  const baseHidden = baseOptions?.hiddenParagraphIds
  const proxyHidden = isAdminProxyConfirm
    ? resolveAgreementAdminProxyConfirmHiddenIds(templateId)
    : undefined
  const hiddenParagraphIds =
    baseHidden != null || proxyHidden != null
      ? new Set([...(baseHidden ?? []), ...(proxyHidden ?? [])])
      : undefined

  const participantName =
    context?.participantName?.trim() ||
    baseOptions?.agreementSystemParticipantName ||
    ''

  return {
    ...baseOptions,
    paragraphInteractionMode: 'user',
    /** preview CSS(pointer-events:none) 대신 본문만 선택 잠금 */
    agreementConsentFillReadOnlyBody: true,
    structureLockedParagraphIds: agreementConfig.structureLockedParagraphIds,
    agreementSystemDisplayMode: 'write',
    agreementSystemParticipantName: participantName,
    portraitPersonalConsentAffiliationOptions: context?.portraitAffiliationSelectOptions,
    /** 초상권 1번 표 — 성명·소속 등 응답 입력만 허용(양식 문구·다른 표 셀은 preview 잠금) */
    portraitConsentResponseFieldsInteractive: templateId === 'agreement-portrait' ? true : undefined,
    /** 구조 잠금 단락 — 본문은 preview 잠금, 하단 동의 라디오만 조작 */
    structureLockedAuthoringChoicePreview:
      baseOptions?.structureLockedAuthoringChoicePreview ?? true,
    agreementAdminProxyConfirm: isAdminProxyConfirm ? true : undefined,
    hiddenParagraphIds,
  }
}
