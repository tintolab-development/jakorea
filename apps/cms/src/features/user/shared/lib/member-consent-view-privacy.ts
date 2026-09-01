import { AGREEMENT_CRIME_TEMPLATE_CODE } from '@/features/template/lib/agreement-crime-consent-settings'

/** 마스킹 대상 PII가 없어 열람 사유 모달을 생략할 때 filled-document API용 고정 사유 */
export const MEMBER_CONSENT_VIEW_AUTO_PRIVACY_REASON = '동의서 보기'

const PRIVACY_REVEAL_TEMPLATE_IDS = new Set<string>([
  'agreement-third-party',
  'document-payment-order-pre-consent',
  'agreement-notice',
  AGREEMENT_CRIME_TEMPLATE_CODE,
])

/**
 * 회원 상세 「동의서 보기」— 제출본 원격 조회 시 개인정보 열람 사유 모달이 필요한지.
 * 지급조서·행정정보·성범죄만 true. 초상권·교육진행자는 false.
 */
export function memberConsentViewRequiresPrivacyReveal(templateId: string): boolean {
  const code = templateId.trim()
  if (!code) return false
  return PRIVACY_REVEAL_TEMPLATE_IDS.has(code)
}
