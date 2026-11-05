import { formatDottedSeoulDateTime } from '../../../../shared/lib/format-display-date.ts'
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
  receiptPreConsent: 'RECEIPT_PRE_CONSENT',
  educatorPledge: 'FACILITATOR_PLEDGE',
  administrativeJoint: 'ADMINISTRATIVE_INFO_CONSENT',
  sexOffenseCheck: 'CRIMINAL_HISTORY_CHECK_CONSENT',
}

const EXPIRED_HINT = '유효기간이 만료되어 재동의가 필요해요.'

const CATALOG_BY_TYPE = new Map(
  SETTINGS_CONSENT_CATALOG.map(item => [SETTINGS_CONSENT_TYPE_BY_ID[item.id], item]),
)
const DOCUMENT_SECTION_IDS = new Set(DOCUMENT_CONSENT_ITEMS.map(item => item.id))

/** 회원 유형별 기본 동의 — `applicable: false`이면 미노출 (동의서·서약서는 유지) */
const MEMBER_TYPE_BASIC_CONSENT_TYPES = new Set([
  'TEACHER_INFO_COLLECTION',
  'GUARDIAN_CONSENT',
  'CHILD_PRIVACY_COLLECTION',
])

/** ISO instant는 서울 시각. `Z` 없는 날짜·시각 문자열은 벽시계 그대로. */
export function formatConsentAgreedAt(value: string | null | undefined): string | undefined {
  return formatDottedSeoulDateTime(value)
}

/** ISO → `2026.07.03` (철회 완료 팝업 일자, 서울 달력) */
export function formatConsentDate(value: string | null | undefined): string | undefined {
  const formatted = formatConsentAgreedAt(value)
  return formatted ? formatted.slice(0, 10) : undefined
}

function normalizeConsentType(value: string | undefined): string {
  const normalized = value?.trim().toUpperCase() ?? ''
  if (normalized === 'PAYMENT_STATEMENT_PRE_CONSENT') return 'PAYMENT_STATEMENT_CONSENT'
  if (normalized === 'AGREEMENT_RECEIPT_PRE_CONSENT') return 'RECEIPT_PRE_CONSENT'
  return normalized
}

/**
 * `GET /api/portal/me/consents` 응답 행을 그대로 카드로 만든다.
 * 행 구성·순서·필수·철회 가능 여부는 서버 값, 제목·종류·약관 보기는 화면 카탈로그.
 * 동의서·서약서는 `applicable: false`도 미동의 카드로 노출.
 * 교사·미성년 전용 기본 동의는 `applicable: false`면 제외.
 */
export function buildConsentItemsFromSummaries(summaries: PortalConsentSummary[]): {
  basicItems: SettingsConsentItem[]
  documentItems: SettingsConsentItem[]
} {
  const basicItems: SettingsConsentItem[] = []
  const documentItems: SettingsConsentItem[] = []
  const seen = new Set<SettingsConsentItemId>()

  for (const summary of summaries) {
    const consentType = normalizeConsentType(summary.consentType)
    if (
      summary.applicable === false &&
      MEMBER_TYPE_BASIC_CONSENT_TYPES.has(consentType)
    ) {
      continue
    }
    const meta = CATALOG_BY_TYPE.get(consentType)
    if (!meta || seen.has(meta.id)) continue
    seen.add(meta.id)

    const expired = summary.expired === true
    const reconsentRequired = summary.reconsentRequired === true
    const status = summary.status?.trim().toUpperCase() ?? ''
    const withdrawn = status === 'WITHDRAWN'
    /** 작성 중 draft documentId만으로는 완료가 아니다. 서버 `agreed`/`signed`/완료 status만 인정. */
    const hasCompletedDocument =
      summary.signed === true ||
      ['AGREED', 'COMPLETED', 'SIGNED', 'SUBMITTED', 'CONSENTED', 'ACTIVE'].includes(status)
    const isDocumentItem = DOCUMENT_SECTION_IDS.has(meta.id)
    const agreed =
      !withdrawn &&
      !expired &&
      !reconsentRequired &&
      (summary.agreed === true || (isDocumentItem && hasCompletedDocument))
    const item: SettingsConsentItem = {
      ...meta,
      required: summary.required ?? meta.required,
      agreed,
      agreedAt: agreed ? formatConsentAgreedAt(summary.agreedAt) : undefined,
      hint: expired || reconsentRequired ? EXPIRED_HINT : meta.hint,
      documentId: summary.documentId ?? undefined,
      withdrawable: summary.withdrawable === true,
      status: summary.status,
      signed: summary.signed === true,
      listed: typeof summary.listed === 'boolean' ? summary.listed : undefined,
    }
    ;(DOCUMENT_SECTION_IDS.has(meta.id) ? documentItems : basicItems).push(item)
  }

  return { basicItems, documentItems }
}
