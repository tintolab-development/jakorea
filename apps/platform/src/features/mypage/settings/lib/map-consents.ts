import type { PortalConsentSummary } from '../api/consents.ts'
import {
  DOCUMENT_CONSENT_ITEMS,
  SETTINGS_CONSENT_CATALOG,
  type SettingsConsentItem,
  type SettingsConsentItemId,
} from './consent-catalog.ts'

/** 화면 항목 ↔ 회원 동의 원장 canonical TERMS_TYPE */
export const SETTINGS_CONSENT_TYPE_BY_ID: Record<SettingsConsentItemId, string> = {
  serviceTerms: 'SERVICE_TERMS',
  privacyCollection: 'PRIVACY_COLLECTION',
  teacherInfo: 'TEACHER_INFO_COLLECTION',
  guardianLegal: 'GUARDIAN_CONSENT',
  childPrivacy: 'CHILD_PRIVACY_COLLECTION',
  marketing: 'MARKETING',
  portrait: 'PORTRAIT_RIGHTS',
  paymentStatement: 'PAYMENT_STATEMENT_CONSENT',
  educatorPledge: 'FACILITATOR_PLEDGE',
  administrativeJoint: 'ADMINISTRATIVE_INFO_CONSENT',
  sexOffenseCheck: 'CRIMINAL_HISTORY_CHECK_CONSENT',
}

const EXPIRED_HINT = '유효기간이 만료되어 재동의가 필요해요.'

const CATALOG_BY_TYPE = new Map(
  SETTINGS_CONSENT_CATALOG.map(item => [SETTINGS_CONSENT_TYPE_BY_ID[item.id], item]),
)
const DOCUMENT_SECTION_IDS = new Set(DOCUMENT_CONSENT_ITEMS.map(item => item.id))

/** ISO `2026-07-03T09:23:00` → `2026.07.03 09:23` */
export function formatConsentAgreedAt(value: string | null | undefined): string | undefined {
  const matched = value?.trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/)
  if (!matched) return undefined
  const date = `${matched[1]}.${matched[2]}.${matched[3]}`
  return matched[4] ? `${date} ${matched[4]}:${matched[5]}` : date
}

/** ISO → `2026.07.03` (철회 완료 팝업 일자) */
export function formatConsentDate(value: string | null | undefined): string | undefined {
  return formatConsentAgreedAt(value)?.slice(0, 10)
}

function normalizeConsentType(value: string | undefined): string {
  const normalized = value?.trim().toUpperCase() ?? ''
  return normalized === 'PAYMENT_STATEMENT_PRE_CONSENT' ? 'PAYMENT_STATEMENT_CONSENT' : normalized
}

/**
 * `GET /api/portal/me/consents` 응답 행을 그대로 카드로 만든다.
 * 행 구성·순서·필수·철회 가능 여부는 서버 값, 제목·종류·약관 보기는 화면 카탈로그.
 * `applicable: false` 행도 숨기지 않는다(미동의 카드).
 */
export function buildConsentItemsFromSummaries(summaries: PortalConsentSummary[]): {
  basicItems: SettingsConsentItem[]
  documentItems: SettingsConsentItem[]
} {
  const basicItems: SettingsConsentItem[] = []
  const documentItems: SettingsConsentItem[] = []
  const seen = new Set<SettingsConsentItemId>()

  for (const summary of summaries) {
    const meta = CATALOG_BY_TYPE.get(normalizeConsentType(summary.consentType))
    if (!meta || seen.has(meta.id)) continue
    seen.add(meta.id)

    const expired = summary.expired === true
    const agreed = summary.agreed === true && !expired
    const item: SettingsConsentItem = {
      ...meta,
      required: summary.required ?? meta.required,
      agreed,
      agreedAt: agreed ? formatConsentAgreedAt(summary.agreedAt) : undefined,
      hint: expired || summary.reconsentRequired === true ? EXPIRED_HINT : meta.hint,
      documentId: summary.documentId ?? undefined,
      withdrawable: summary.withdrawable === true,
    }
    ;(DOCUMENT_SECTION_IDS.has(meta.id) ? documentItems : basicItems).push(item)
  }

  return { basicItems, documentItems }
}
