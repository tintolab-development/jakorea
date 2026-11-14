export const AGREEMENT_CRIME_TEMPLATE_CODE = 'agreement-crime' as const

/** 템플릿 관리 [문서 변경] — 카탈로그 원본 양식은 PDF만 */
export const CRIME_CONSENT_UPLOAD_ACCEPT = 'application/pdf,.pdf'

/**
 * 회원 화면 동의서 업로드 팝업(시안 6647:36345) — 작성본 증빙 PDF·JPG·PNG, 최대 20MB.
 * 서버 관리자 `CRIMINAL_HISTORY_CONSENT_ORIGINAL` 허용 형식(PDF/JPG/JPEG/PNG, 20MB)과 같다 (BE 2026-11-14).
 */
export const MEMBER_CRIME_CONSENT_EVIDENCE_UPLOAD_ACCEPT =
  'application/pdf,.pdf,image/jpeg,.jpg,.jpeg,image/png,.png'

export const MEMBER_CRIME_CONSENT_EVIDENCE_MAX_BYTES = 20 * 1024 * 1024

const PDF_FILE_NAME_PATTERN = /\.pdf$/i
const MEMBER_CRIME_CONSENT_EVIDENCE_FILE_NAME_PATTERN = /\.(pdf|jpe?g|png)$/i
const MEMBER_CRIME_CONSENT_EVIDENCE_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
])

export type AgreementCrimeConsentSettings = {
  documentImageUrl?: string
  replacementFileName?: string | null
}

export function parseAgreementCrimeConsentSettings(
  value: Record<string, unknown> | undefined
): AgreementCrimeConsentSettings {
  if (value == null) return {}
  const documentImageUrl =
    typeof value.documentImageUrl === 'string' && value.documentImageUrl.trim() !== ''
      ? value.documentImageUrl
      : undefined
  const replacementFileName =
    typeof value.replacementFileName === 'string' ? value.replacementFileName : null
  return { documentImageUrl, replacementFileName }
}

export function buildAgreementCrimeConsentSettings(args: {
  documentImageUrl: string
  replacementFileName: string | null
}): AgreementCrimeConsentSettings {
  return {
    documentImageUrl: args.documentImageUrl,
    replacementFileName: args.replacementFileName,
  }
}

export async function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
        return
      }
      reject(new Error('invalid image data'))
    }
    reader.onerror = () => reject(reader.error ?? new Error('read failed'))
    reader.readAsDataURL(file)
  })
}

/** @deprecated use readFileAsDataUrl */
export const readImageFileAsDataUrl = readFileAsDataUrl

export function isCrimeConsentUploadFile(file: File): boolean {
  const mime = file.type.trim().toLowerCase()
  if (mime === 'application/pdf') return true
  return PDF_FILE_NAME_PATTERN.test(file.name)
}

/** 회원 화면 동의서 업로드 팝업 — PDF·JPG·PNG */
export function isMemberCrimeConsentEvidenceUploadFile(file: File): boolean {
  const mime = file.type.trim().toLowerCase()
  if (MEMBER_CRIME_CONSENT_EVIDENCE_MIME_TYPES.has(mime)) return true
  return MEMBER_CRIME_CONSENT_EVIDENCE_FILE_NAME_PATTERN.test(file.name)
}

export function isCrimeConsentPdfPreviewSrc(
  src: string,
  fileName?: string | null,
  mimeType?: string | null
): boolean {
  if (mimeType?.trim().toLowerCase() === 'application/pdf') return true
  if (fileName != null && PDF_FILE_NAME_PATTERN.test(fileName)) return true
  if (src.startsWith('data:application/pdf')) return true
  return /\.pdf(?:$|[?#])/i.test(src)
}
