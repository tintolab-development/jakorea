import { isAxiosError } from 'axios'
import { axiosClient } from '@/shared/api/axios-instance'
import { portalPublicFileDownloadUrl } from '@/shared/lib/portal-public-file-url'
import {
  CRIME_CONSENT_MESSAGES,
  readCrimeConsentErrorCodeFromBody,
  resolveCrimeConsentApiErrorMessage,
} from './crime-consent-original'

export class CrimeConsentCatalogDownloadError extends Error {
  readonly code: string | null
  readonly status: number | null

  constructor(message: string, code: string | null = null, status: number | null = null) {
    super(message)
    this.name = 'CrimeConsentCatalogDownloadError'
    this.code = code
    this.status = status
  }
}

function saveBlobFile(fileName: string, blob: Blob): void {
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = fileName
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0)
}

async function readErrorBody(data: unknown): Promise<unknown> {
  if (data instanceof Blob) {
    try {
      return JSON.parse(await data.text())
    } catch {
      return null
    }
  }
  return data
}

/**
 * 관리자가 게시한 성범죄 동의서 양식 파일.
 * `fileObjectId`는 포털 응답의 catalogDocument에서만 오고, FE가 만들지 않는다.
 * 회원 완성본 `.../documents/{documentId}/content` 와 구분한다.
 */
export async function downloadCrimeConsentCatalogDocument(input: {
  fileObjectId: number
  fileName: string
}): Promise<void> {
  const fileObjectId = input.fileObjectId
  if (!Number.isSafeInteger(fileObjectId) || fileObjectId <= 0) {
    throw new CrimeConsentCatalogDownloadError(CRIME_CONSENT_MESSAGES.formFileUnavailable)
  }
  const fileName = input.fileName.trim() || CRIME_CONSENT_MESSAGES.formFileFallbackName
  const path = portalPublicFileDownloadUrl(fileObjectId)
  try {
    const res = await axiosClient.get<Blob>(path, { responseType: 'blob' })
    const blob = res.data
    if (!(blob instanceof Blob) || blob.size === 0) {
      throw new CrimeConsentCatalogDownloadError(CRIME_CONSENT_MESSAGES.formFileUnavailable)
    }
    saveBlobFile(fileName, blob)
  } catch (error) {
    if (error instanceof CrimeConsentCatalogDownloadError) throw error
    if (!isAxiosError(error)) {
      throw new CrimeConsentCatalogDownloadError(CRIME_CONSENT_MESSAGES.formFileUnavailable)
    }
    if (error.response == null) {
      throw new CrimeConsentCatalogDownloadError(CRIME_CONSENT_MESSAGES.network)
    }
    const status = error.response.status
    const code = readCrimeConsentErrorCodeFromBody(await readErrorBody(error.response.data))
    throw new CrimeConsentCatalogDownloadError(
      resolveCrimeConsentApiErrorMessage({ code, status }, CRIME_CONSENT_MESSAGES.formFileUnavailable),
      code,
      status,
    )
  }
}

/** OpenAPI 포털 동의 문서에 catalogDocument가 없어 양식 파일을 고를 수 없다. */
export async function downloadCrimeConsentFormDocument(): Promise<void> {
  throw new CrimeConsentCatalogDownloadError(CRIME_CONSENT_MESSAGES.formFileUnavailable)
}
