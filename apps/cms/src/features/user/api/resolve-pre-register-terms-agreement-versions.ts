import { fetchCurrentTermsDocumentsMetaMap } from '@/features/user/api/fetch-current-terms-document'

type TermsAgreementLike = {
  termsType: string
  version: string
  required?: boolean
  agreed?: boolean
  termsSnapshotJson?: string
}

/**
 * pre-register / 관리자 등록 요청 직전 — termsAgreements.version만
 * 현재 게시 약관 문서(`GET /api/public/terms-documents/{termsType}/current`) 기준으로 갱신.
 *
 * `required` 는 FE 등록 정책 매트릭스(`build-pre-register-terms-agreements`)를 유지한다.
 * terms-documents `requiredYn`으로 덮어쓰면 선택 약관이 필수로 바뀌어 등록이 거절될 수 있다.
 * @see apps/cms/docs/api/members/members-pre-register-terms-required-policy-backend-request-2026-08-11.md §7
 */
export async function resolvePreRegisterTermsAgreementVersions<T extends TermsAgreementLike>(
  agreements: T[] | undefined
): Promise<T[] | undefined> {
  if (!agreements?.length) return agreements

  const termsTypes = agreements.map(row => row.termsType).filter(Boolean)
  const metaMap = await fetchCurrentTermsDocumentsMetaMap(termsTypes)
  const missing = termsTypes.filter(type => !metaMap.has(type))

  if (missing.length > 0) {
    throw new Error(
      `약관 버전을 불러오지 못했습니다. (${missing.join(', ')}) 잠시 후 다시 시도해 주세요.`
    )
  }

  return agreements.map(agreement => {
    const meta = metaMap.get(agreement.termsType)!
    return {
      ...agreement,
      version: meta.version,
    }
  })
}
