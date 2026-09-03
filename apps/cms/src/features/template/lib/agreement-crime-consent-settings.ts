export const AGREEMENT_CRIME_TEMPLATE_CODE = 'agreement-crime' as const

export const CRIME_CONSENT_UPLOAD_ACCEPT = 'application/pdf,image/*,.pdf,.jpg,.jpeg,.png,.gif,.webp'

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
