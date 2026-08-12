import type { MemberConsentRecordResponse } from '@/shared/api/generated/members/schemas'
import type { TermsAgreementRow } from '@/shared/api/generated/members/schemas/termsAgreementRow'
import type {
  ConsentFieldValueSchema,
  ConsentRowSchema,
} from '@/features/user/detail/ui/user-consent-agreement-section'
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
}

export function resolveTermsTypeToConsentLabel(type: string | undefined): string | undefined {
  const trimmed = type?.trim()
  if (!trimmed) return undefined
  return TERMS_TYPE_TO_LABEL[trimmed.toUpperCase()] ?? trimmed
}

function resolveConsentRecordLabel(record: MemberConsentRecordResponse): string | undefined {
  return resolveTermsTypeToConsentLabel(record.consentType)
}

function formatConsentedAt(iso: string | undefined): string | undefined {
  if (!iso?.trim()) return undefined
  const parsed = dayjs(iso)
  if (!parsed.isValid()) return iso
  return parsed.format('YYYY.MM.DD HH:mm:ss')
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

function buildConsentRecordLabelMap(
  records: MemberConsentRecordResponse[]
): Map<string, AgreementOverlay> {
  const map = new Map<string, AgreementOverlay>()
  for (const record of records) {
    const label = resolveConsentRecordLabel(record)
    if (!label) continue
    map.set(label, {
      agreed: record.consentValue === true,
      agreedAt: record.consentedAt,
      formResponseId: record.formResponseId,
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

/** 상세 `termsAgreements` + `consent-records` → 약관·동의 UI 스키마.
 * 상세 `termsAgreements`가 있으면 이를 SSOT로 쓰고, 없을 때만 consent-records를 사용한다.
 */
export function applyMemberConsentToSchema(
  schema: ConsentRowSchema[],
  input: {
    consentRecords?: MemberConsentRecordResponse[]
    termsAgreements?: TermsAgreementRow[]
  }
): ConsentRowSchema[] {
  const terms = input.termsAgreements ?? []
  const records = input.consentRecords ?? []

  if (terms.length === 0 && records.length === 0) {
    return neutralizeConsentSchema(schema)
  }

  const result = neutralizeConsentSchema(schema)

  // 상세 약관이 있으면 상세만 반영 (consent-records로 덮어쓰지 않음)
  if (terms.length > 0) {
    return overlayAgreementByLabel(result, buildTermsAgreementLabelMap(terms))
  }

  return overlayAgreementByLabel(result, buildConsentRecordLabelMap(records))
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
