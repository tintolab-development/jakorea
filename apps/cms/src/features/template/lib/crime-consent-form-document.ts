import crimeConsentFormDocumentAssetUrl from '@/shared/assets/documents/crime_consent_form.pdf'
import { downloadBlob } from '@/shared/utils/file-download'

export const CRIME_CONSENT_FORM_DOWNLOAD_FILENAME = '성범죄 경력 조회 동의서_양식.pdf'

export const crimeConsentFormDocumentUrl = crimeConsentFormDocumentAssetUrl

/** 성범죄 동의서 작성 모달의 [문서 다운로드]는 항상 지정 양식 PDF를 받는다. */
export async function downloadCrimeConsentFormDocument(): Promise<void> {
  const res = await fetch(crimeConsentFormDocumentUrl)
  if (!res.ok) throw new Error('fetch failed')
  const blob = await res.blob()
  downloadBlob(blob, CRIME_CONSENT_FORM_DOWNLOAD_FILENAME)
}
