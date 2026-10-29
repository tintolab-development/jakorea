export const AGREEMENT_CRIME_TEMPLATE_CODE = 'agreement-crime' as const

export const CRIME_CONSENT_UPLOAD_ACCEPT = 'application/pdf,image/*,.pdf,.jpg,.jpeg,.png,.gif,.webp'

/** 작성 양식 원본 문서 교체(FORM_CATALOG_DOCUMENT) — PDF만, 최대 20MB */
export const CATALOG_DOCUMENT_UPLOAD_ACCEPT = 'application/pdf,.pdf'
export const CATALOG_DOCUMENT_MAX_BYTES = 20 * 1024 * 1024

const PDF_FILE_NAME_PATTERN = /\.pdf$/i
const IMAGE_FILE_NAME_PATTERN = /\.(jpe?g|png|gif|webp|bmp|heic|heif)$/i

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

export async function readImageFileAsDataUrl(file: File): Promise<string> {
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

export function isCrimeConsentUploadFile(file: File): boolean {
  const mime = file.type.trim().toLowerCase()
  if (mime === 'application/pdf' || mime.startsWith('image/')) return true
  return PDF_FILE_NAME_PATTERN.test(file.name) || IMAGE_FILE_NAME_PATTERN.test(file.name)
}

export type CatalogDocumentUploadValidation = 'ok' | 'type' | 'size'

/** MIME이 비어 있는 브라우저를 고려해 확장자도 본다. MIME이 PDF가 아니라고 명시되면 거절한다. */
export function validateCatalogDocumentUploadFile(file: File): CatalogDocumentUploadValidation {
  const mime = file.type.trim().toLowerCase()
  const nameIsPdf = PDF_FILE_NAME_PATTERN.test(file.name)
  const typeOk = mime === '' || mime === 'application/octet-stream' ? nameIsPdf : mime === 'application/pdf' && nameIsPdf
  if (!typeOk) return 'type'
  if (file.size > CATALOG_DOCUMENT_MAX_BYTES) return 'size'
  return 'ok'
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
