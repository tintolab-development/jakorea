import { fetchCurrentTermsDocumentsMetaMap } from '@/features/user/api/fetch-current-terms-document'

type TermsAgreementLike = {
  termsType: string
  version: string
  required?: boolean
  agreed?: boolean
  termsSnapshotJson?: string
}

/**
 * pre-register / 관리자 등록 요청 직전 — termsAgreements.version을
 * 현재 게시 약관 문서(`GET /api/public/terms-documents/{termsType}/current`) 기준으로 갱신.
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
      ...(meta.required != null ? { required: meta.required } : {}),
    }
  })
}
