import crimeConsentFormDocumentAssetUrl from '@/shared/assets/documents/crime_consent_form.pdf'

/** CMS `apps/cms/src/shared/assets/documents/crime_consent_form.pdf` 와 동일 */
export const CRIME_CONSENT_FORM_DOWNLOAD_FILENAME = '성범죄 경력 조회 동의서_양식.pdf'

export const crimeConsentFormDocumentUrl = crimeConsentFormDocumentAssetUrl

export async function downloadCrimeConsentFormDocument(): Promise<void> {
  const res = await fetch(crimeConsentFormDocumentUrl)
  if (!res.ok) throw new Error('fetch failed')
  const blob = await res.blob()
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = CRIME_CONSENT_FORM_DOWNLOAD_FILENAME
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0)
}
