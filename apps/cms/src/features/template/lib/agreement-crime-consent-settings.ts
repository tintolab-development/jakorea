export const AGREEMENT_CRIME_TEMPLATE_CODE = 'agreement-crime' as const

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
