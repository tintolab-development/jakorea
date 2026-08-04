import type { MemberConsentRecordResponse } from '@/shared/api/generated/members/schemas'
import type {
  ConsentFieldValueSchema,
  ConsentRowSchema,
} from '@/features/user/detail/ui/user-consent-agreement-section'
import dayjs from 'dayjs'

/** consentType → UI 라벨 (백엔드 enum 확인 전 임시 매핑) */
const CONSENT_TYPE_TO_LABEL: Record<string, string> = {
  TERMS: '서비스 이용약관',
  TERMS_OF_SERVICE: '서비스 이용약관',
  SERVICE_TERMS: '서비스 이용약관',
  PERSONAL_INFO: '개인정보 수집·이용 동의',
  PERSONAL_INFO_COLLECTION: '개인정보 수집·이용 동의',
  MARKETING: '마케팅 제공 동의',
  MARKETING_CONSENT: '마케팅 제공 동의',
  PORTRAIT_RIGHTS: '초상권 수집·이용 동의',
  PORTRAIT: '초상권 수집·이용 동의',
  PAYMENT_STATEMENT: '지급조서 사전 동의서',
  PAYMENT_STATEMENT_CONSENT: '지급조서 사전 동의서',
  SEX_OFFENSE_CHECK: '성범죄 경력 조회 동의서',
  SEXUAL_OFFENSE_CHECK: '성범죄 경력 조회 동의서',
  ADMIN_INFO_SHARING: '행정정보 공동이용 사전동의서',
  ADMINISTRATIVE_INFO_SHARING: '행정정보 공동이용 사전동의서',
  EDUCATOR_PLEDGE: '교육진행자 서약서',
  INSTRUCTOR_PLEDGE: '교육진행자 서약서',
  MFA: '2단계 인증(MFA) 설정 동의',
  MFA_SETUP: '2단계 인증(MFA) 설정 동의',
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

function resolveConsentLabel(record: MemberConsentRecordResponse): string | undefined {
  const type = record.consentType?.trim()
  if (!type) return undefined
  const mapped = CONSENT_TYPE_TO_LABEL[type.toUpperCase()]
  if (mapped) return mapped
  return type
}

function formatConsentedAt(iso: string | undefined): string | undefined {
  if (!iso?.trim()) return undefined
  const parsed = dayjs(iso)
  if (!parsed.isValid()) return iso
  return parsed.format('YYYY.MM.DD HH:mm:ss')
}

function recordToFieldValue(
  record: MemberConsentRecordResponse,
  label: string
): ConsentFieldValueSchema {
  const agreed = record.consentValue === true
  const agreedAtDisplay = formatConsentedAt(record.consentedAt)

  if (DOCUMENT_LABELS.has(label)) {
    return { type: 'document', agreed, agreedAtDisplay: agreed ? agreedAtDisplay : undefined }
  }

  return {
    type: 'remote_consent',
    agreed,
    agreedAtDisplay,
  }
}

function buildLabelRecordMap(
  records: MemberConsentRecordResponse[]
): Map<string, MemberConsentRecordResponse> {
  const map = new Map<string, MemberConsentRecordResponse>()
  for (const record of records) {
    const label = resolveConsentLabel(record)
    if (label) map.set(label, record)
  }
  return map
}

/** API 동의 레코드를 기존 스키마 행에 오버레이 (remote 모드) */
export function applyConsentRecordsToSchema(
  schema: ConsentRowSchema[],
  records: MemberConsentRecordResponse[]
): ConsentRowSchema[] {
  if (records.length === 0) {
    return schema.map(row => ({
      ...row,
      fields: row.fields.map(field => {
        if (field.value.type === 'empty_half') return field
        if (field.value.type === 'document') {
          return { ...field, value: { type: 'document' as const, agreed: false } }
        }
        return field
      }),
    }))
  }

  const byLabel = buildLabelRecordMap(records)

  return schema.map(row => ({
    ...row,
    fields: row.fields.map(field => {
      if (field.value.type === 'empty_half' || !field.label.trim()) return field
      const record = byLabel.get(field.label)
      if (!record) return field
      return {
        ...field,
        value: recordToFieldValue(record, field.label),
      }
    }),
  }))
}
