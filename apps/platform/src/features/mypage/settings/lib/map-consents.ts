import type { PortalConsentSummary } from '../api/consents.ts'
import type { SettingsConsentItem, SettingsConsentItemId } from './consent-catalog.ts'

/** 화면 항목 ↔ 회원 동의 원장 canonical TERMS_TYPE */
export const SETTINGS_CONSENT_TYPE_BY_ID: Record<SettingsConsentItemId, string> = {
  serviceTerms: 'SERVICE_TERMS',
  privacyCollection: 'PRIVACY_COLLECTION',
  marketing: 'MARKETING',
  portrait: 'PORTRAIT_RIGHTS',
  paymentStatement: 'PAYMENT_STATEMENT_CONSENT',
  educatorPledge: 'FACILITATOR_PLEDGE',
  administrativeJoint: 'ADMINISTRATIVE_INFO_CONSENT',
  sexOffenseCheck: 'CRIMINAL_HISTORY_CHECK_CONSENT',
}

const EXPIRED_HINT = '유효기간이 만료되어 재동의가 필요해요.'

/** ISO `2026-07-03T09:23:00` → `2026.07.03 09:23` */
export function formatConsentAgreedAt(value: string | undefined): string | undefined {
  const matched = value?.trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/)
  if (!matched) return undefined
  const date = `${matched[1]}.${matched[2]}.${matched[3]}`
  return matched[4] ? `${date} ${matched[4]}:${matched[5]}` : date
}

function normalizeConsentType(value: string | undefined): string {
  const normalized = value?.trim().toUpperCase() ?? ''
  return normalized === 'PAYMENT_STATEMENT_PRE_CONSENT' ? 'PAYMENT_STATEMENT_CONSENT' : normalized
}

/**
 * 화면 카탈로그(제목·필수·종류·약관 보기)에 서버 동의 상태를 덮어쓴다.
 * 응답에 없는 항목은 미동의, `applicable: false` 항목은 숨긴다.
 */
export function mergeConsentItemsWithSummaries(
  items: SettingsConsentItem[],
  summaries: PortalConsentSummary[],
): SettingsConsentItem[] {
  const byType = new Map(summaries.map(summary => [normalizeConsentType(summary.consentType), summary]))

  return items.flatMap(item => {
    const summary = byType.get(SETTINGS_CONSENT_TYPE_BY_ID[item.id])
    if (summary?.applicable === false) return []

    const expired = summary?.expired === true
    const agreed = summary?.agreed === true && !expired

    return [
      {
        ...item,
        agreed,
        agreedAt: agreed ? formatConsentAgreedAt(summary?.agreedAt) : undefined,
        hint: expired ? EXPIRED_HINT : item.hint,
        documentId: summary?.documentId,
      },
    ]
  })
}
