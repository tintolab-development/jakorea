import { isAxiosError } from 'axios'
import { axiosClient } from '@/shared/api/axios-instance'
import {
  CRIME_CONSENT_MESSAGES,
  readCrimeConsentErrorCodeFromBody,
  resolveCrimeConsentApiErrorMessage,
} from '../../instructor-apply/consent/crime-consent-original'
import { toRuleDownloadFileName } from '@/shared/lib/download-file-name'

const FALLBACK_FILE_NAME = '성범죄 경력 조회 동의서.pdf'

/** 원본 다운로드 실패. `message`는 화면 안내 문구, `code`·`status`는 서버 응답 그대로. */
export class CrimeConsentDownloadError extends Error {
  readonly code: string | null
  readonly status: number | null

  constructor(message: string, code: string | null = null, status: number | null = null) {
    super(message)
    this.name = 'CrimeConsentDownloadError'
    this.code = code
    this.status = status
  }
}

function saveBlobFile(fileName: string, blob: Blob): void {
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = toRuleDownloadFileName(fileName)
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0)
}

/** `responseType: 'blob'` 오류 응답은 JSON도 Blob으로 온다. */
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

async function toDownloadError(error: unknown): Promise<CrimeConsentDownloadError> {
  if (error instanceof CrimeConsentDownloadError) return error
  if (!isAxiosError(error)) {
    return new CrimeConsentDownloadError(CRIME_CONSENT_MESSAGES.downloadFailed)
  }
  if (error.response == null) {
    return new CrimeConsentDownloadError(CRIME_CONSENT_MESSAGES.network)
  }
  const status = error.response.status
  const code = readCrimeConsentErrorCodeFromBody(await readErrorBody(error.response.data))
  return new CrimeConsentDownloadError(
    resolveCrimeConsentApiErrorMessage({ code, status }, CRIME_CONSENT_MESSAGES.downloadFailed),
    code,
    status,
  )
}

function isPdfResponse(contentType: unknown, blob: Blob): boolean {
  const header = typeof contentType === 'string' ? contentType.toLowerCase() : ''
  return header.includes('application/pdf') || blob.type.toLowerCase().includes('application/pdf')
}

function contentPath(documentId: number): string {
  return `/api/portal/me/consents/documents/${encodeURIComponent(String(documentId))}/content`
}

async function downloadOriginal(documentId: number): Promise<void> {
  try {
    const res = await axiosClient.get<Blob>(contentPath(documentId), { responseType: 'blob' })
    const blob = res.data
    if (!(blob instanceof Blob) || blob.size === 0 || !isPdfResponse(res.headers['content-type'], blob)) {
      throw new CrimeConsentDownloadError(CRIME_CONSENT_MESSAGES.downloadFailed)
    }
    const pdf = blob.type ? blob : new Blob([blob], { type: 'application/pdf' })
    saveBlobFile(FALLBACK_FILE_NAME, pdf)
  } catch (error) {
    throw await toDownloadError(error)
  }
}

export type SubmittedCrimeConsentOriginal =
  | { kind: 'pdf'; blob: Blob }
  | { kind: 'image'; blob: Blob }

/**
 * 미리보기용 — 제출한 원본을 같은 GET .../content로 받아 파일로 저장하지 않고 돌려준다.
 * PDF와 이미지(JPG·PNG)를 구분한다. 그 밖의 형식이나 빈 응답은 실패로 본다.
 */
export async function fetchSubmittedCrimeConsentOriginal(
  documentId: number,
): Promise<SubmittedCrimeConsentOriginal> {
  try {
    const res = await axiosClient.get<Blob>(contentPath(documentId), { responseType: 'blob' })
    const blob = res.data
    if (!(blob instanceof Blob) || blob.size === 0) {
      throw new CrimeConsentDownloadError(CRIME_CONSENT_MESSAGES.downloadFailed)
    }
    const header = String(res.headers['content-type'] ?? '').toLowerCase()
    const type = (blob.type || header).toLowerCase()
    if (isPdfResponse(header, blob)) {
      return { kind: 'pdf', blob: blob.type ? blob : new Blob([blob], { type: 'application/pdf' }) }
    }
    if (type.includes('image/jpeg') || type.includes('image/png')) {
      return { kind: 'image', blob }
    }
    throw new CrimeConsentDownloadError(CRIME_CONSENT_MESSAGES.downloadFailed)
  } catch (error) {
    throw await toDownloadError(error)
  }
}

const inflightDownloads = new Map<number, Promise<void>>()

/**
 * 제출한 성범죄 동의서 원본 PDF — GET .../content (OpenAPI: 본인 업로드 원본 relay).
 * 409 등 실패 시 `/download-requests`로 폴백하지 않는다. 같은 문서의 중복 요청은 하나로 합친다.
 */
export function downloadSubmittedCrimeConsent(documentId: number): Promise<void> {
  const pending = inflightDownloads.get(documentId)
  if (pending) return pending
  const request = downloadOriginal(documentId).finally(() => {
    inflightDownloads.delete(documentId)
  })
  inflightDownloads.set(documentId, request)
  return request
}
