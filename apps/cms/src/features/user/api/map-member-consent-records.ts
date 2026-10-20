import type { MemberConsentRecordResponse } from '@/shared/api/generated/members/schemas'
import type { MemberPortalConsentSummary } from '@/shared/api/generated/members/schemas/memberPortalConsentSummary'
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
  MARKETING: '마케팅 제공 동의',
  MARKETING_CONSENT: '마케팅 제공 동의',
  PORTRAIT_RIGHTS: '초상권 수집·이용 동의',
  PORTRAIT: '초상권 수집·이용 동의',
  PAYMENT_STATEMENT: '지급조서 사전 동의서',
  PAYMENT_STATEMENT_CONSENT: '지급조서 사전 동의서',
  PAYMENT_STATEMENT_PRE_CONSENT: '지급조서 사전 동의서',
  PAYMENT: '지급조서 사전 동의서',
  SEX_OFFENSE_CHECK: '성범죄 경력 조회 동의서',
  SEXUAL_OFFENSE_CHECK: '성범죄 경력 조회 동의서',
  CRIME_CHECK: '성범죄 경력 조회 동의서',
  CRIMINAL_HISTORY_CHECK_CONSENT: '성범죄 경력 조회 동의서',
  ADMIN_INFO_SHARING: '행정정보 공동이용 사전동의서',
  ADMINISTRATIVE_INFO_SHARING: '행정정보 공동이용 사전동의서',
  ADMINISTRATIVE_JOINT: '행정정보 공동이용 사전동의서',
  ADMINISTRATIVE_INFO_CONSENT: '행정정보 공동이용 사전동의서',
  ADMIN_INFO_JOINT: '행정정보 공동이용 사전동의서',
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
  '2단계 인증(MFA) 설정 동의': 'MFA_SETUP_CONSENT',
  ...CONSENT_LABEL_TO_EDITABLE_TERMS_TYPE,
}

const DOCUMENT_LABELS = new Set([
  '초상권 수집·이용 동의',
  '지급조서 사전 동의서',
  '성범죄 경력 조회 동의서',
  '행정정보 공동이용 사전동의서',
  '교육진행자 서약서',
])

type AgreementOverlay = {
  agreed: boolean
  agreedAt?: string
  formResponseId?: number
  filledDocumentId?: number
  filledDocumentAvailable?: boolean
  filledDocumentRevealEndpoint?: string
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
  return parsed.format('YYYY.MM.DD HH:mm')
}

function agreementToFieldValue(
  agreement: AgreementOverlay,
  label: string
): ConsentFieldValueSchema {
  const agreed = agreement.agreed
  const agreedAtDisplay = formatConsentedAt(agreement.agreedAt)

  if (DOCUMENT_LABELS.has(label)) {
    return {
      type: 'document',
      agreed,
      agreedAtDisplay: agreed ? agreedAtDisplay : undefined,
      formResponseId: agreement.formResponseId,
      filledDocumentId: agreement.filledDocumentId,
      filledDocumentAvailable: agreement.filledDocumentAvailable,
      filledDocumentRevealEndpoint: agreement.filledDocumentRevealEndpoint,
      consentType: agreement.consentType,
    }
  }

  return {
    type: 'remote_consent',
    agreed,
    agreedAtDisplay,
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

function compareConsentRecordRecency(
  a: MemberConsentRecordResponse,
  b: MemberConsentRecordResponse
): number {
  const aTime = a.consentedAt ? dayjs(a.consentedAt).valueOf() : 0
  const bTime = b.consentedAt ? dayjs(b.consentedAt).valueOf() : 0
  if (aTime !== bTime) return aTime - bTime
  const aId = a.formResponseId ?? a.filledDocumentId ?? 0
  const bId = b.formResponseId ?? b.filledDocumentId ?? 0
  return aId - bId
}

/** consent-records — 작성본·이력 메타만 (동의 여부는 Summary 또는 termsAgreements) */
function buildConsentRecordMetaByTypeMap(
  records: MemberConsentRecordResponse[]
): Map<string, AgreementOverlay> {
  const latestByType = new Map<string, MemberConsentRecordResponse>()
  for (const record of records) {
    const typeKey = normalizeConsentTypeKey(record.consentType)
    if (!typeKey) continue
    const prev = latestByType.get(typeKey)
    if (!prev || compareConsentRecordRecency(record, prev) > 0) {
      latestByType.set(typeKey, record)
    }
  }

  const map = new Map<string, AgreementOverlay>()
  for (const [typeKey, record] of latestByType) {
    map.set(typeKey, {
      agreed: false,
      formResponseId: record.formResponseId,
      filledDocumentId: record.filledDocumentId,
      filledDocumentAvailable: record.filledDocumentAvailable,
      filledDocumentRevealEndpoint: record.filledDocumentRevealEndpoint,
      consentType: record.consentType,
    })
  }
  return map
}

function buildConsentSummaryTypeMap(
  summaries: MemberPortalConsentSummary[]
): Map<string, MemberPortalConsentSummary> {
  const map = new Map<string, MemberPortalConsentSummary>()
  for (const row of summaries) {
    const typeKey = normalizeConsentTypeKey(row.consentType)
    if (!typeKey) continue
    map.set(typeKey, row)
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
    })
  }
  return map
}

function mergeRecordMetaIntoOverlay(
  overlay: AgreementOverlay,
  meta: AgreementOverlay | undefined
): AgreementOverlay {
  if (!meta) return overlay
  return {
    ...overlay,
    formResponseId: meta.formResponseId ?? overlay.formResponseId,
    filledDocumentId: meta.filledDocumentId ?? overlay.filledDocumentId,
    filledDocumentAvailable: meta.filledDocumentAvailable ?? overlay.filledDocumentAvailable,
    filledDocumentRevealEndpoint:
      meta.filledDocumentRevealEndpoint ?? overlay.filledDocumentRevealEndpoint,
    consentType: meta.consentType ?? overlay.consentType,
  }
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

function buildLabelMapFromSummaries(
  schema: ConsentRowSchema[],
  summaries: MemberPortalConsentSummary[],
  recordMetaByType: Map<string, AgreementOverlay>
): Map<string, AgreementOverlay> {
  const summaryMap = buildConsentSummaryTypeMap(summaries)
  const labelMap = new Map<string, AgreementOverlay>()

  for (const row of schema) {
    for (const field of row.fields) {
      if (field.value.type === 'empty_half' || !field.label.trim()) continue
      const typeKey = resolveCanonicalTermsTypeForLabel(field.label)
      if (!typeKey) continue
      const summary = summaryMap.get(typeKey)
      if (!summary) continue

      const agreed = summary.agreed === true
      const overlay: AgreementOverlay = {
        agreed,
        agreedAt: agreed ? summary.agreedAt : undefined,
      }
      labelMap.set(
        field.label,
        mergeRecordMetaIntoOverlay(overlay, recordMetaByType.get(typeKey))
      )
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
  const recordMetaByType = buildConsentRecordMetaByTypeMap(records)
  const termsMap = buildTermsAgreementLabelMap(terms)

  for (const [label, termsOverlay] of termsMap) {
    const typeKey = resolveCanonicalTermsTypeForLabel(label)
    const merged = typeKey
      ? mergeRecordMetaIntoOverlay(termsOverlay, recordMetaByType.get(typeKey))
      : termsOverlay
    termsMap.set(label, merged)
  }

  return overlayAgreementByLabel(result, termsMap)
}

/** 상세 약관·동의 UI — 일반 회원은 Summary `agreed`/`agreedAt` SSOT, 관리자 계정은 `termsAgreements`. */
export function applyMemberConsentToSchema(
  schema: ConsentRowSchema[],
  input: {
    consentSummaries?: MemberPortalConsentSummary[]
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
    const recordMetaByType = buildConsentRecordMetaByTypeMap(records)
    const labelMap = buildLabelMapFromSummaries(result, summaries, recordMetaByType)
    return overlayAgreementByLabel(result, labelMap)
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
