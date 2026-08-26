import { fetchCurrentTermsDocumentMeta } from '@/features/user/api/fetch-current-terms-document'

/**
 * 관리자 셀프가입 `termsVersion` —
 * `GET /api/public/terms-documents/SERVICE_TERMS/current` 응답 version을 사용한다.
 * (셀프가입은 4종 약관을 동일 version으로 저장)
 */
export async function resolveAdminSelfSignupTermsVersion(): Promise<string> {
  const meta = await fetchCurrentTermsDocumentMeta('SERVICE_TERMS')
  const version = meta?.version?.trim()
  if (!version) {
    throw new Error('약관 버전을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.')
  }
  return version
}
