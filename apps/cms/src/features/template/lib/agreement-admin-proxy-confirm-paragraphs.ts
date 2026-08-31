import {
  AGREEMENT_NOTICE_PARAGRAPH_IDS,
  AGREEMENT_PORTRAIT_PARAGRAPH_IDS,
  EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS,
} from '@/features/template/model/writing-form-draft.schema'
import { PAYMENT_STATEMENT_PRE_CONSENT_IDS } from '@/features/template/model/payment-statement-pre-consent-draft'

/** 관리자 대리 동의 확인 2단 카드를 호스트하는 단락 ID */
export const AGREEMENT_ADMIN_PROXY_CONFIRM_HOST_IDS = new Set<string>([
  AGREEMENT_PORTRAIT_PARAGRAPH_IDS.confirmationClosing,
  AGREEMENT_NOTICE_PARAGRAPH_IDS.confirmationClosing,
  EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS.violationClosing,
  PAYMENT_STATEMENT_PRE_CONSENT_IDS.midConsentLine,
  PAYMENT_STATEMENT_PRE_CONSENT_IDS.finalConfirm,
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
