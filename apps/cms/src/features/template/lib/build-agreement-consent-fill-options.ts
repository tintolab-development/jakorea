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

/** 회원관리(등록·상세) 동의서 작성 — 양식 본문은 읽기 전용(preview) */
export function resolveAgreementConsentFillInteractionMode(
  _templateId?: string
): ParagraphBodyInteractionMode {
  return 'preview'
}

/**
 * 회원·강사 등록/상세 — 동의서 작성 모달 본문 옵션.
 * 템플릿 관리(authoring)와 달리 본문·표 셀은 수정 불가(preview)이며, 하단 동의 라디오 등만 조작한다.
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
    paragraphInteractionMode: 'preview',
    structureLockedParagraphIds: agreementConfig.structureLockedParagraphIds,
    agreementSystemDisplayMode: 'write',
    agreementSystemParticipantName: participantName,
    portraitPersonalConsentAffiliationOptions: context?.portraitAffiliationSelectOptions,
    /** 초상권 1번 표 — 성명·소속 등 응답 입력만 허용(양식 문구·다른 표 셀은 preview 잠금) */
    portraitConsentResponseFieldsInteractive: templateId === 'agreement-portrait' ? true : undefined,
    /** 구조 잠금 단락 — 본문은 preview 잠금, 하단 동의 라디오만 조작 */
    structureLockedAuthoringChoicePreview:
      baseOptions?.structureLockedAuthoringChoicePreview ?? true,
    /** 지급조서 사전 동의 — 기본정보 블록은 발급용처럼 조회 전용 */
    ...(baseOptions?.paymentStatementBasicInfoOnlyPaymentPurposeLocked === true
      ? { paymentStatementDisplayMode: 'document' as const }
      : {}),
    agreementAdminProxyConfirm: isAdminProxyConfirm ? true : undefined,
    hiddenParagraphIds,
  }
}
