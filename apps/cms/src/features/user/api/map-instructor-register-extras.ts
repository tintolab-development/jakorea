import type { Dayjs } from 'dayjs'
import type { InstructorCertificationUpsertRequest } from '@/shared/api/generated/members/schemas/instructorCertificationUpsertRequest'
export {
  ADMIN_PRE_REGISTER_TERMS_VERSION,
  buildInstructorRegisterTermsAgreements,
  buildPreRegisterTermsAgreements,
  type PreRegisterConsentValue as InstructorRegisterConsentValue,
} from '@/features/user/api/build-pre-register-terms-agreements'

export type InstructorRegisterConsentFields = {
  consentTermsOfService: 'agree' | 'disagree'
  consentPersonal: 'agree' | 'disagree'
  consentMarketing: 'agree' | 'disagree'
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
