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

/**
 * 만료·재동의 안내 — 기획(노션 사용자 '약관 및 동의 항목') 동의서별 문구.
 * `null`이면 문구 없이 태그만. 목록에 없는 항목은 공통 문구(`EXPIRED_HINT`)를 쓴다.
 */
const EXPIRED_HINT_BY_ID: Partial<Record<SettingsConsentItemId, string | null>> = {
  portrait: '프로그램을 신청하시려면 다시 동의해 주세요.',
  educatorPledge: '교육진행자 활동을 위해 다시 작성해 주세요.',
  sexOffenseCheck: '교육진행자 활동을 위해 다시 동의해 주세요.',
  paymentStatement: '정산을 신청하시려면 다시 동의해 주세요.',
  receiptPreConsent: '정산을 신청하시려면 다시 동의해 주세요.',
  administrativeJoint: null,
}

/**
 * 기간제 동의서 6종 — 기획상 「동의 만료」·만료 안내 적용 대상.
 * 서비스 이용약관·개인정보·교사 정보·법정대리인(탈퇴 시까지)과 마케팅은 만료가 없으므로
 * 서버가 `expired`를 보내도 만료로 처리하지 않는다.
 */
const FIXED_TERM_CONSENT_IDS: ReadonlySet<SettingsConsentItemId> = new Set<SettingsConsentItemId>([
  'portrait',
  'educatorPledge',
  'administrativeJoint',
  'sexOffenseCheck',
  'paymentStatement',
  'receiptPreConsent',
])

function resolveExpiredHint(id: SettingsConsentItemId): string | undefined {
  if (!(id in EXPIRED_HINT_BY_ID)) return EXPIRED_HINT
  return EXPIRED_HINT_BY_ID[id] ?? undefined
}

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

export function readPortalConsentDocumentId(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value.trim())
    if (Number.isFinite(parsed) && parsed > 0) return parsed
  }
  return undefined
}

function consentItemCompleteness(item: SettingsConsentItem): number {
  return (item.signed ? 4 : 0) + (item.agreed ? 2 : 0) + (item.documentId != null ? 1 : 0)
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
    if (!meta) continue

    const expired = summary.expired === true && FIXED_TERM_CONSENT_IDS.has(meta.id)
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
      hint: expired || reconsentRequired ? resolveExpiredHint(meta.id) : meta.hint,
      documentId: readPortalConsentDocumentId(summary.documentId),
      withdrawable: summary.withdrawable === true,
      status: summary.status,
      consentStatus: summary.consentStatus,
      consentType,
      allItemsAgreed: summary.allItemsAgreed ?? null,
      expired,
      signed: summary.signed === true,
      listed: typeof summary.listed === 'boolean' ? summary.listed : undefined,
    }
    const target = DOCUMENT_SECTION_IDS.has(meta.id) ? documentItems : basicItems
    if (seen.has(meta.id)) {
      const index = target.findIndex(row => row.id === meta.id)
      if (index >= 0 && consentItemCompleteness(item) > consentItemCompleteness(target[index]!)) {
        target[index] = item
      }
      continue
    }
    seen.add(meta.id)
    target.push(item)
  }

  return { basicItems, documentItems }
}
