import type { Dayjs } from 'dayjs'
import type { InstructorCertificationUpsertRequest } from '@/shared/api/generated/members/schemas/instructorCertificationUpsertRequest'
import type { TermsAgreementRequest } from '@/shared/api/generated/members/schemas/termsAgreementRequest'

/** CMS 관리자 사전등록 — 약관 카탈로그 미연동 시 사용하는 기본 버전 */
export const ADMIN_PRE_REGISTER_TERMS_VERSION = '1.0'

type ConsentValue = 'agree' | 'disagree'

export type InstructorRegisterConsentFields = {
  consentTermsOfService: ConsentValue
  consentPersonal: ConsentValue
  consentMarketing: ConsentValue
}

export type InstructorRegisterLicenseRow = {
  acquiredYear: Dayjs | null
  title: string
  issuer: string
}

export type InstructorRegisterEducationSummaryFields = {
  eduSchoolType?: string
  eduStatus?: string
}

/**
 * 라디오 동의(서비스/개인정보/마케팅) → `termsAgreements`.
 * 동의서 작성형(초상권·지급조서 등)은 termsType·작성 API가 없어 제외.
 */
export function buildInstructorRegisterTermsAgreements(
  values: InstructorRegisterConsentFields
): TermsAgreementRequest[] {
  return [
    {
      termsType: 'SERVICE_TERMS',
      version: ADMIN_PRE_REGISTER_TERMS_VERSION,
      required: true,
      agreed: values.consentTermsOfService === 'agree',
    },
    {
      termsType: 'PRIVACY_COLLECTION',
      version: ADMIN_PRE_REGISTER_TERMS_VERSION,
      required: true,
      agreed: values.consentPersonal === 'agree',
    },
    {
      termsType: 'MARKETING',
      version: ADMIN_PRE_REGISTER_TERMS_VERSION,
      required: false,
      agreed: values.consentMarketing === 'agree',
    },
  ]
}

/** 자격증 rows → `certifications` (제목 있는 행만) */
export function buildInstructorRegisterCertifications(
  licenseRows: InstructorRegisterLicenseRow[] | undefined
): InstructorCertificationUpsertRequest[] | undefined {
  if (licenseRows == null || licenseRows.length === 0) return undefined

  const certifications = licenseRows
    .map(row => {
      const certificationName = row.title.trim()
      if (!certificationName) return null
      const issuer = row.issuer.trim()
      const issuedDate = row.acquiredYear?.isValid()
        ? row.acquiredYear.format('YYYY-01-01')
        : undefined
      return {
        certificationName,
        ...(issuer ? { issuer } : {}),
        ...(issuedDate ? { issuedDate } : {}),
      } satisfies InstructorCertificationUpsertRequest
    })
    .filter((row): row is InstructorCertificationUpsertRequest => row != null)

  return certifications.length > 0 ? certifications : undefined
}

/** 학력 요약 문자열 → `educationLevel` (구조화 학력은 서버 스키마 필요) */
export function buildInstructorRegisterEducationLevel(
  values: InstructorRegisterEducationSummaryFields
): string | undefined {
  const parts = [values.eduSchoolType?.trim(), values.eduStatus?.trim()].filter(Boolean)
  return parts.length > 0 ? parts.join(' / ') : undefined
}
