import { fetchCurrentTermsDocumentsMetaMap } from './fetch-current-terms-document'
import type { InstructorRoleRequestTermsAgreement } from './types'

export const INSTRUCTOR_APPLY_TERMS_VERSION_RESOLVE_FAILED_MESSAGE =
  '약관 버전을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'

/**
 * 강사 신청 제출 직전 — termsAgreements.version만
 * `GET /api/public/terms-documents/{termsType}/current` 기준으로 갱신.
 * `required` 는 FE 매핑(작성형 동의서 = false)을 유지한다.
 */
export async function resolveInstructorApplyTermsAgreementVersions(
  agreements: InstructorRoleRequestTermsAgreement[],
): Promise<InstructorRoleRequestTermsAgreement[]> {
  if (agreements.length === 0) return agreements

  const termsTypes = agreements.map(row => row.termsType).filter(Boolean)
  const metaMap = await fetchCurrentTermsDocumentsMetaMap(termsTypes)
  const missing = termsTypes.filter(type => !metaMap.has(type))

  if (missing.length > 0) {
    throw new Error(INSTRUCTOR_APPLY_TERMS_VERSION_RESOLVE_FAILED_MESSAGE)
  }

  return agreements.map(agreement => {
    const meta = metaMap.get(agreement.termsType)!
    return {
      ...agreement,
      version: meta.version,
    }
  })
}
