import {
  AGREEMENT_NOTICE_PARAGRAPH_IDS,
  AGREEMENT_PORTRAIT_PARAGRAPH_IDS,
  DEFAULT_DIRECT_AGREEMENT_PARAGRAPH_IDS,
  EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS,
} from '@/features/template/model/writing-form-draft.schema'
import { AGREEMENT_EXPENSE_A4_PREVIEW_BODY_CLASS_NAME } from '@/features/template/model/agreement-expense-a4-preview'
import { AGREEMENT_NOTICE_A4_PREVIEW_BODY_CLASS_NAME } from '@/features/template/model/agreement-notice-a4-preview'
import { AGREEMENT_PORTRAIT_A4_PREVIEW_BODY_CLASS_NAME } from '@/features/template/model/agreement-portrait-a4-preview'
import { PAYMENT_STATEMENT_PRE_CONSENT_A4_PREVIEW_BODY_CLASS_NAME } from '@/features/template/model/payment-statement-pre-consent-a4-preview'
import { PAYMENT_STATEMENT_PRE_CONSENT_IDS } from '@/features/template/model/payment-statement-pre-consent-draft'

/** 관리자 대리 동의 확인 2단 카드를 호스트하는 단락 ID */
export const AGREEMENT_ADMIN_PROXY_CONFIRM_HOST_IDS = new Set<string>([
  AGREEMENT_PORTRAIT_PARAGRAPH_IDS.confirmationClosing,
  AGREEMENT_NOTICE_PARAGRAPH_IDS.confirmationClosing,
  EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS.violationClosing,
  PAYMENT_STATEMENT_PRE_CONSENT_IDS.midConsentLine,
  PAYMENT_STATEMENT_PRE_CONSENT_IDS.finalConfirm,
  DEFAULT_DIRECT_AGREEMENT_PARAGRAPH_IDS.closing,
])

/**
 * 호스트 단락이 확인 카드로 합쳐질 때 숨길 날짜·서명 단락.
 * 이후 템플릿은 호스트 ID + hidden 목록만 추가하면 동일 UI 재사용.
 */
export const AGREEMENT_ADMIN_PROXY_CONFIRM_HIDDEN_IDS_BY_HOST: Readonly<
  Record<string, readonly string[]>
> = {
  [AGREEMENT_PORTRAIT_PARAGRAPH_IDS.confirmationClosing]: [
    AGREEMENT_PORTRAIT_PARAGRAPH_IDS.systemDate,
    AGREEMENT_PORTRAIT_PARAGRAPH_IDS.systemSignature,
  ],
  [AGREEMENT_NOTICE_PARAGRAPH_IDS.confirmationClosing]: [
    AGREEMENT_NOTICE_PARAGRAPH_IDS.systemDate,
    AGREEMENT_NOTICE_PARAGRAPH_IDS.systemSignature,
  ],
  [EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS.violationClosing]: [
    EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS.systemDate,
    EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS.systemSignature,
  ],
  [PAYMENT_STATEMENT_PRE_CONSENT_IDS.midConsentLine]: [
    PAYMENT_STATEMENT_PRE_CONSENT_IDS.midDate,
    PAYMENT_STATEMENT_PRE_CONSENT_IDS.midSignature,
  ],
  [PAYMENT_STATEMENT_PRE_CONSENT_IDS.finalConfirm]: [
    PAYMENT_STATEMENT_PRE_CONSENT_IDS.tailDate,
    PAYMENT_STATEMENT_PRE_CONSENT_IDS.tailSignature,
  ],
  [DEFAULT_DIRECT_AGREEMENT_PARAGRAPH_IDS.closing]: [
    DEFAULT_DIRECT_AGREEMENT_PARAGRAPH_IDS.systemDate,
    DEFAULT_DIRECT_AGREEMENT_PARAGRAPH_IDS.systemSignature,
  ],
}

/** 회원 동의 fill에서 확인 블록을 쓰는 템플릿 코드 */
export const AGREEMENT_ADMIN_PROXY_CONFIRM_TEMPLATE_IDS = new Set<string>([
  'agreement-portrait',
  'agreement-notice',
  'agreement-expense',
  'agreement-third-party',
  'document-payment-order-pre-consent',
])

const PAYMENT_STATEMENT_PRE_CONSENT_PROXY_HOST_IDS = [
  PAYMENT_STATEMENT_PRE_CONSENT_IDS.midConsentLine,
  PAYMENT_STATEMENT_PRE_CONSENT_IDS.finalConfirm,
] as const

const TEMPLATE_HOST_IDS: Readonly<Record<string, readonly string[]>> = {
  'agreement-portrait': [AGREEMENT_PORTRAIT_PARAGRAPH_IDS.confirmationClosing],
  'agreement-notice': [AGREEMENT_NOTICE_PARAGRAPH_IDS.confirmationClosing],
  'agreement-expense': [EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS.violationClosing],
  'agreement-third-party': PAYMENT_STATEMENT_PRE_CONSENT_PROXY_HOST_IDS,
  'document-payment-order-pre-consent': PAYMENT_STATEMENT_PRE_CONSENT_PROXY_HOST_IDS,
}

export function isAgreementAdminProxyConfirmHostId(paragraphId: string): boolean {
  return AGREEMENT_ADMIN_PROXY_CONFIRM_HOST_IDS.has(paragraphId)
}

/** 대리작성 확인 카드에 합쳐져 숨겨지는 날짜·서명 단락 ID 전체 */
export function getAllAgreementAdminProxyConfirmHiddenIds(): Set<string> {
  const out = new Set<string>()
  for (const ids of Object.values(AGREEMENT_ADMIN_PROXY_CONFIRM_HIDDEN_IDS_BY_HOST)) {
    for (const id of ids) out.add(id)
  }
  return out
}

/**
 * A4 contentOnly에서 대리작성 카드를 끄고 날짜·서명 플랫 스택을 쓸지.
 * - proxy 플래그가 꺼져 있으면 기존처럼 flatten
 * - 지급조서·교육진행자 서약·행정정보·초상권은 A4 미리보기에서만 flatten (작성 화면 카드는 유지)
 */
const AGREEMENT_A4_FLAT_PROXY_CONFIRM_BODY_CLASS_NAMES = new Set<string>([
  PAYMENT_STATEMENT_PRE_CONSENT_A4_PREVIEW_BODY_CLASS_NAME,
  AGREEMENT_EXPENSE_A4_PREVIEW_BODY_CLASS_NAME,
  AGREEMENT_NOTICE_A4_PREVIEW_BODY_CLASS_NAME,
  AGREEMENT_PORTRAIT_A4_PREVIEW_BODY_CLASS_NAME,
])

export function shouldFlattenAgreementAdminProxyConfirmInA4Preview(input: {
  agreementAdminProxyConfirm?: boolean
  documentPreviewClassName?: string
}): boolean {
  if (input.agreementAdminProxyConfirm !== true) return true
  const className = input.documentPreviewClassName
  return className != null && AGREEMENT_A4_FLAT_PROXY_CONFIRM_BODY_CLASS_NAMES.has(className)
}

/** 제출 문서 미리보기 — 저장 날짜·서명·document 모드가 있으면 실제 값 유지 */
export function isSubmittedAgreementA4SignaturePreview(input: {
  agreementSystemDisplayMode?: string
  agreementSystemNow?: Date
  agreementSystemSignatureImageSrc?: string
}): boolean {
  return (
    input.agreementSystemDisplayMode === 'document' ||
    input.agreementSystemNow != null ||
    Boolean(input.agreementSystemSignatureImageSrc?.trim())
  )
}

/**
 * A4 contentOnly — 대리작성 카드(shadow) 대신 날짜·서명 플랫 스택을 쓰기 위해
 * proxy용 숨김 ID만 제거하고 확인 카드 플래그를 끈다.
 */
export function resolveAgreementA4DocumentHiddenParagraphIds(
  hiddenParagraphIds: ReadonlySet<string> | undefined
): ReadonlySet<string> | undefined {
  if (hiddenParagraphIds == null) return undefined
  const proxyHidden = getAllAgreementAdminProxyConfirmHiddenIds()
  const next = new Set([...hiddenParagraphIds].filter(id => !proxyHidden.has(id)))
  return next.size > 0 ? next : undefined
}

/** 템플릿별 숨김 단락(날짜·서명) ID 집합 */
export function resolveAgreementAdminProxyConfirmHiddenIds(templateId: string): Set<string> {
  const hosts = TEMPLATE_HOST_IDS[templateId] ?? []
  const out = new Set<string>()
  for (const hostId of hosts) {
    for (const id of AGREEMENT_ADMIN_PROXY_CONFIRM_HIDDEN_IDS_BY_HOST[hostId] ?? []) {
      out.add(id)
    }
  }
  return out
}

/** 지급조서 사전 동의서 authoring — mid/tail 날짜·서명 숨김 */
export function getPaymentStatementPreConsentAdminProxyHiddenIds(): Set<string> {
  return resolveAgreementAdminProxyConfirmHiddenIds('agreement-third-party')
}

/** 초상권 수집·이용 동의서 authoring — system 날짜·서명 숨김 */
export function getAgreementPortraitAdminProxyHiddenIds(): Set<string> {
  return resolveAgreementAdminProxyConfirmHiddenIds('agreement-portrait')
}

/** 행정정보 공동이용 사전 동의서 authoring — system 날짜·서명 숨김 */
export function getAgreementNoticeAdminProxyHiddenIds(): Set<string> {
  return resolveAgreementAdminProxyConfirmHiddenIds('agreement-notice')
}

/** 교육진행자 동의 서약서 authoring — system 날짜·서명 숨김 */
export function getEducatorFacilitatorPledgeAdminProxyHiddenIds(): Set<string> {
  return resolveAgreementAdminProxyConfirmHiddenIds('agreement-expense')
}

/** 직접 등록 신규 동의 양식 — closing에 날짜·서명 합침 */
export function getDirectAgreementAdminProxyHiddenIds(): Set<string> {
  return new Set(
    AGREEMENT_ADMIN_PROXY_CONFIRM_HIDDEN_IDS_BY_HOST[DEFAULT_DIRECT_AGREEMENT_PARAGRAPH_IDS.closing] ??
      []
  )
}
