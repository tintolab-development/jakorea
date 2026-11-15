import type { MemberConsentRecordResponse } from '@/shared/api/generated/members/schemas'
import type { AdminMemberConsentSummary } from '@/shared/api/generated/members/schemas/adminMemberConsentSummary'
import type { FilledDocumentUnavailableReason } from '@/shared/api/generated/members/schemas/filledDocumentUnavailableReason'
import type { TermsAgreementRow } from '@/shared/api/generated/members/schemas/termsAgreementRow'
import type {
  ConsentFieldValueSchema,
  ConsentRowSchema,
} from '@/features/user/detail/ui/user-consent-agreement-section'
import { CONSENT_LABEL_TO_EDITABLE_TERMS_TYPE } from '@/features/user/api/member-basic-info-terms-patch'
import { normalizeTermsTypeAliasGroup } from '@/features/user/api/terms-document-type-alias'
import dayjs from 'dayjs'

/** termsType / consentType → UI 라벨 */
export const TERMS_TYPE_TO_LABEL: Record<string, string> = {
  TERMS: '서비스 이용약관',
  TERMS_OF_SERVICE: '서비스 이용약관',
  SERVICE_TERMS: '서비스 이용약관',
  PERSONAL_INFO: '개인정보 수집·이용 동의',
  PERSONAL_INFO_COLLECTION: '개인정보 수집·이용 동의',
  PRIVACY_COLLECTION: '개인정보 수집·이용 동의',
  PRIVACY: '개인정보 수집·이용 동의',
  CHILD_PRIVACY_COLLECTION: '개인정보 수집·이용 동의',
  GUARDIAN_CONSENT: '법정대리인 동의',
  TEACHER_INFO_COLLECTION: '교사 및 기관 정보 동의',
  MARKETING: '마케팅 제공 동의',
  MARKETING_CONSENT: '마케팅 제공 동의',
  PORTRAIT_RIGHTS: '초상권 수집·이용 동의',
  PORTRAIT: '초상권 수집·이용 동의',
  PAYMENT_STATEMENT: '지급조서 사전 동의서',
  PAYMENT_STATEMENT_CONSENT: '지급조서 사전 동의서',
  PAYMENT_STATEMENT_PRE_CONSENT: '지급조서 사전 동의서',
  PAYMENT: '지급조서 사전 동의서',
  SEX_OFFENSE_CHECK: '성범죄경력 조회 동의서',
  SEXUAL_OFFENSE_CHECK: '성범죄경력 조회 동의서',
  CRIME_CHECK: '성범죄경력 조회 동의서',
  CRIMINAL_HISTORY_CHECK_CONSENT: '성범죄경력 조회 동의서',
  ADMIN_INFO_SHARING: '행정정보 공동이용 동의서',
  ADMINISTRATIVE_INFO_SHARING: '행정정보 공동이용 동의서',
  ADMINISTRATIVE_JOINT: '행정정보 공동이용 동의서',
  ADMINISTRATIVE_INFO_CONSENT: '행정정보 공동이용 동의서',
  ADMIN_INFO_JOINT: '행정정보 공동이용 동의서',
  EDUCATOR_PLEDGE: '교육진행자 서약서',
  FACILITATOR_PLEDGE: '교육진행자 서약서',
  INSTRUCTOR_PLEDGE: '교육진행자 서약서',
  EDUCATOR: '교육진행자 서약서',
  MFA: '2단계 인증(MFA) 설정 동의',
  MFA_SETUP: '2단계 인증(MFA) 설정 동의',
  MFA_SETUP_CONSENT: '2단계 인증(MFA) 설정 동의',
  TWO_FACTOR_AUTH: '2단계 인증(MFA) 설정 동의',
  TWO_FACTOR_AUTHENTICATION: '2단계 인증(MFA) 설정 동의',
}

/** UI 라벨 → canonical consentType (Summary·records 매칭용 — 라벨만 키로 쓰지 않음) */
export const CONSENT_LABEL_TO_CANONICAL_TERMS_TYPE: Record<string, string> = {
  '서비스 이용약관': 'SERVICE_TERMS',
  '개인정보 수집·이용 동의': 'PRIVACY_COLLECTION',
  '마케팅 제공 동의': 'MARKETING',
  '법정대리인 동의': 'GUARDIAN_CONSENT',
  '교사 및 기관 정보 동의': 'TEACHER_INFO_COLLECTION',
  '2단계 인증(MFA) 설정 동의': 'MFA_SETUP_CONSENT',
  ...CONSENT_LABEL_TO_EDITABLE_TERMS_TYPE,
}

const DOCUMENT_LABELS = new Set([
  '초상권 수집·이용 동의',
  '지급조서 사전 동의서',
  '성범죄경력 조회 동의서',
  '행정정보 공동이용 동의서',
  /** 구 라벨 별칭 — 2026-10-29 라벨 변경 전 문자열 */
  '성범죄 경력 조회 동의서',
  '행정정보 공동이용 사전동의서',
  '교육진행자 서약서',
])

type AgreementOverlay = {
  agreed: boolean
  agreedAt?: string
  consentStatus?: string
  /** 초상권 1·2·3 모두 동의 여부(표시 전용). 비초상권·판정 불가 과거 기록은 null */
  allItemsAgreed?: boolean | null
  /** Summary `status === 'EXPIRED'` — 기간제(동의서형) 항목에만 표시에 쓴다 */
  expired?: boolean
  /** Summary `expiresAt` — 만료일 표시용 */
  expiresAt?: string
  consentRecordId?: number
  formResponseId?: number
  filledDocumentId?: number
  filledDocumentAvailable?: boolean
  filledDocumentRevealEndpoint?: string
  filledDocumentUnavailableReason?: FilledDocumentUnavailableReason
  signedDocumentAvailable?: boolean
  signedDocumentId?: number
  signedDocumentRevealEndpoint?: string
  consentType?: string
}

export function resolveTermsTypeToConsentLabel(type: string | undefined): string | undefined {
  const trimmed = type?.trim()
  if (!trimmed) return undefined
  return TERMS_TYPE_TO_LABEL[trimmed.toUpperCase()] ?? trimmed
}

function normalizeConsentTypeKey(consentType: string | undefined): string {
  if (!consentType?.trim()) return ''
  return normalizeTermsTypeAliasGroup(consentType.trim())
}

function resolveCanonicalTermsTypeForLabel(label: string): string | undefined {
  const key = CONSENT_LABEL_TO_CANONICAL_TERMS_TYPE[label.trim()]
  return key ? normalizeConsentTypeKey(key) : undefined
}

function formatConsentedAt(iso: string | undefined): string | undefined {
  if (!iso?.trim()) return undefined
  const parsed = dayjs(iso)
  if (!parsed.isValid()) return iso
  return parsed.format('YYYY.MM.DD HH:mm:ss')
}

function formatConsentDate(iso: string | undefined): string | undefined {
  if (!iso?.trim()) return undefined
  const parsed = dayjs(iso)
  if (!parsed.isValid()) return iso
  return parsed.format('YYYY.MM.DD')
}

function agreementToFieldValue(
  agreement: AgreementOverlay,
  label: string
): ConsentFieldValueSchema {
  const agreed = agreement.agreed
  const agreedAtDisplay = formatConsentedAt(agreement.agreedAt)

  if (DOCUMENT_LABELS.has(label)) {
    /** 동의서형 항목은 모두 기간제 — Summary status=EXPIRED면 「동의 만료」 + 만료일 */
    const expired = agreement.expired === true
    return {
      type: 'document',
      agreed,
      agreedAtDisplay: agreed ? agreedAtDisplay : undefined,
      consentStatus: agreement.consentStatus,
      allItemsAgreed: agreement.allItemsAgreed,
      ...(expired
        ? { expired: true, expiredAtDisplay: formatConsentDate(agreement.expiresAt) }
        : {}),
      formResponseId: agreement.formResponseId,
      filledDocumentId: agreement.filledDocumentId,
      filledDocumentAvailable: agreement.filledDocumentAvailable,
      filledDocumentRevealEndpoint: agreement.filledDocumentRevealEndpoint,
      filledDocumentUnavailableReason: agreement.filledDocumentUnavailableReason,
      signedDocumentAvailable: agreement.signedDocumentAvailable,
      signedDocumentId: agreement.signedDocumentId,
      signedDocumentRevealEndpoint: agreement.signedDocumentRevealEndpoint,
      consentType: agreement.consentType,
      consentRecordId: agreement.consentRecordId,
    }
  }

  return {
    type: 'remote_consent',
    agreed,
    agreedAtDisplay,
    consentStatus: agreement.consentStatus,
    consentType: agreement.consentType,
    allItemsAgreed: agreement.allItemsAgreed,
  }
}

function neutralizeConsentFieldValue(value: ConsentFieldValueSchema): ConsentFieldValueSchema {
  if (value.type === 'empty_half') return value
  if (value.type === 'document') {
    return { type: 'document', agreed: false }
  }
  return { type: 'remote_consent', agreed: false }
}

function neutralizeConsentSchema(schema: ConsentRowSchema[]): ConsentRowSchema[] {
  return schema.map(row => ({
    ...row,
    fields: row.fields.map(field => ({
      ...field,
      value: neutralizeConsentFieldValue(field.value),
    })),
  }))
}

function consentIndexKeys(consentType: string | undefined, label?: string): string[] {
  const keys: string[] = []
  const typeKey = normalizeConsentTypeKey(consentType)
  if (typeKey) keys.push(typeKey)
  const resolvedLabel = label?.trim() || resolveTermsTypeToConsentLabel(consentType)
  if (resolvedLabel) keys.push(`label:${resolvedLabel}`)
  return [...new Set(keys)]
}

function lookupConsentIndex<T>(
  map: Map<string, T>,
  consentType: string | undefined,
  label?: string
): T | undefined {
  for (const key of consentIndexKeys(consentType, label)) {
    const hit = map.get(key)
    if (hit) return hit
  }
  return undefined
}

function readTermsConsentRecordId(row: TermsAgreementRow): number | undefined {
  const value = (row as TermsAgreementRow & { consentRecordId?: number | null }).consentRecordId
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

/** records 응답의 작성본 열람 메타 — 같은 유형 중 고르지 않고, 지정한 기록 id와 정확히 일치할 때만 쓴다 */
function toConsentRecordDocumentMeta(record: MemberConsentRecordResponse): Partial<AgreementOverlay> {
  return {
    consentRecordId: record.consentRecordId,
    formResponseId: record.formResponseId ?? undefined,
    filledDocumentId: record.filledDocumentId ?? undefined,
    filledDocumentAvailable: record.filledDocumentAvailable === true,
    filledDocumentRevealEndpoint: record.filledDocumentRevealEndpoint ?? undefined,
    filledDocumentUnavailableReason: record.filledDocumentUnavailableReason ?? undefined,
  }
}

function buildConsentSummaryTypeMap(
  summaries: AdminMemberConsentSummary[]
): Map<string, AdminMemberConsentSummary> {
  const map = new Map<string, AdminMemberConsentSummary>()
  for (const row of summaries) {
    for (const key of consentIndexKeys(row.consentType)) {
      map.set(key, row)
    }
  }
  return map
}

function buildTermsAgreementLabelMap(
  terms: TermsAgreementRow[]
): Map<string, AgreementOverlay> {
  const map = new Map<string, AgreementOverlay>()
  for (const row of terms) {
    const label = resolveTermsTypeToConsentLabel(row.termsType)
    if (!label) continue
    map.set(label, {
      agreed: row.agreed === true,
      agreedAt: row.agreedAt,
      consentStatus: row.consentStatus,
      allItemsAgreed: row.allItemsAgreed,
      consentRecordId: readTermsConsentRecordId(row),
      consentType: row.termsType,
    })
  }
  return map
}

function overlayAgreementByLabel(
  schema: ConsentRowSchema[],
  labelToAgreement: Map<string, AgreementOverlay>
): ConsentRowSchema[] {
  if (labelToAgreement.size === 0) return schema

  return schema.map(row => ({
    ...row,
    fields: row.fields.map(field => {
      if (field.value.type === 'empty_half' || !field.label.trim()) return field
      const agreement = labelToAgreement.get(field.label)
      if (!agreement) return field
      return {
        ...field,
        value: agreementToFieldValue(agreement, field.label),
      }
    }),
  }))
}

/** Summary `status` 중 「동의」로 표시하는 값. 그 외(NOT_AGREED·WITHDRAWN·POLICY_UPDATED 등)는 미동의 */
const AGREED_SUMMARY_STATUSES = new Set(['AGREED', 'SIGNED', 'CONSENTED'])
const EXPIRED_SUMMARY_STATUS = 'EXPIRED'

/** 상태 문구는 Summary `status` 하나로 정한다 (`agreed`·`expired` 조합을 쓰지 않음) */
export function resolveConsentSummaryStatusState(status: string | null | undefined): {
  agreed: boolean
  expired: boolean
} {
  const normalized = (status ?? '').trim().toUpperCase()
  return {
    agreed: AGREED_SUMMARY_STATUSES.has(normalized),
    expired: normalized === EXPIRED_SUMMARY_STATUS,
  }
}

/** Summary 한 건 → 표시 값. 작성본·서명본 열람 메타도 BE가 고른 대표 기록 값만 쓴다 */
function toSummaryOverlay(summary: AdminMemberConsentSummary): AgreementOverlay {
  const { agreed, expired } = resolveConsentSummaryStatusState(summary.status)
  return {
    agreed,
    agreedAt: agreed ? (summary.agreedAt ?? undefined) : undefined,
    consentType: summary.consentType,
    consentStatus: summary.consentStatus ?? undefined,
    allItemsAgreed: summary.allItemsAgreed,
    expired,
    expiresAt: expired ? (summary.expiresAt ?? undefined) : undefined,
    consentRecordId: summary.currentConsentRecordId ?? undefined,
    filledDocumentAvailable: summary.filledDocumentAvailable === true,
    filledDocumentRevealEndpoint: summary.filledDocumentRevealEndpoint ?? undefined,
    filledDocumentUnavailableReason: summary.filledDocumentUnavailableReason ?? undefined,
    signedDocumentAvailable: summary.signedDocumentAvailable === true,
    signedDocumentId: summary.signedDocumentId ?? undefined,
    signedDocumentRevealEndpoint: summary.signedDocumentRevealEndpoint ?? undefined,
  }
}

function buildLabelMapFromSummaries(
  schema: ConsentRowSchema[],
  summaries: AdminMemberConsentSummary[]
): Map<string, AgreementOverlay> {
  const summaryMap = buildConsentSummaryTypeMap(summaries)
  const labelMap = new Map<string, AgreementOverlay>()

  for (const row of schema) {
    for (const field of row.fields) {
      if (field.value.type === 'empty_half' || !field.label.trim()) continue
      const typeKey = resolveCanonicalTermsTypeForLabel(field.label)
      const summary = lookupConsentIndex(summaryMap, typeKey, field.label)
      if (!summary) continue
      labelMap.set(field.label, toSummaryOverlay(summary))
    }
  }
  return labelMap
}

function applyTermsAgreementsWithRecordMeta(
  schema: ConsentRowSchema[],
  terms: TermsAgreementRow[],
  records: MemberConsentRecordResponse[]
): ConsentRowSchema[] {
  const result = neutralizeConsentSchema(schema)
  const recordById = new Map<number, MemberConsentRecordResponse>()
  for (const record of records) {
    if (record.consentRecordId != null) recordById.set(record.consentRecordId, record)
  }
  const termsMap = buildTermsAgreementLabelMap(terms)

  for (const [label, termsOverlay] of termsMap) {
    const record =
      termsOverlay.consentRecordId != null ? recordById.get(termsOverlay.consentRecordId) : undefined
    if (record) termsMap.set(label, { ...termsOverlay, ...toConsentRecordDocumentMeta(record) })
  }

  return overlayAgreementByLabel(result, termsMap)
}

/**
 * 상세 약관·동의 UI — 일반 회원은 Summary가 상태·작성본·서명본 열람 여부의 SSOT.
 * 관리자 계정 등 Summary가 없을 때만 `termsAgreements`(+ 같은 consentRecordId의 records 메타).
 */
export function applyMemberConsentToSchema(
  schema: ConsentRowSchema[],
  input: {
    consentSummaries?: AdminMemberConsentSummary[]
    /** Summary가 없을 때 termsAgreements의 consentRecordId와 일치하는 기록 메타만 쓴다 */
    consentRecords?: MemberConsentRecordResponse[]
    /** 관리자 계정 상세 등 — current summary API 미사용 */
    termsAgreements?: TermsAgreementRow[]
  }
): ConsentRowSchema[] {
  const summaries = input.consentSummaries ?? []
  const records = input.consentRecords ?? []
  const terms = input.termsAgreements ?? []

  if (summaries.length > 0) {
    const result = neutralizeConsentSchema(schema)
    return overlayAgreementByLabel(result, buildLabelMapFromSummaries(result, summaries))
  }

  if (terms.length > 0) {
    return applyTermsAgreementsWithRecordMeta(schema, terms, records)
  }

  return neutralizeConsentSchema(schema)
}

/** @deprecated `applyMemberConsentToSchema` 사용 */
export function applyConsentRecordsToSchema(
  schema: ConsentRowSchema[],
  records: MemberConsentRecordResponse[]
): ConsentRowSchema[] {
  return applyMemberConsentToSchema(schema, { consentRecords: records })
}

export function applyTermsAgreementsToSchema(
  schema: ConsentRowSchema[],
  termsAgreements: TermsAgreementRow[]
): ConsentRowSchema[] {
  return applyMemberConsentToSchema(schema, { termsAgreements })
}
