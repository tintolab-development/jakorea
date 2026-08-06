import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import { customInstance } from '@/shared/api/orval-mutator'
import type { TermsDocumentResponse } from '@/shared/api/generated/members/schemas/termsDocumentResponse'

export type CurrentTermsDocumentMeta = {
  version: string
  required?: boolean
}

export async function fetchCurrentTermsDocumentMeta(
  termsType: string
): Promise<CurrentTermsDocumentMeta | null> {
  const normalized = termsType.trim()
  if (!normalized) return null

  try {
    const payload = await customInstance<TermsDocumentResponse>({
      url: `/api/public/terms-documents/${encodeURIComponent(normalized)}/current`,
      method: 'GET',
    })
    const doc = unwrapApiBody<TermsDocumentResponse>(payload)
    const version = doc.version?.trim()
    if (!version) return null
    return {
      version,
      required: doc.requiredYn,
    }
  } catch {
    return null
  }
}

export async function fetchCurrentTermsDocumentsMetaMap(
  termsTypes: string[]
): Promise<Map<string, CurrentTermsDocumentMeta>> {
  const unique = [...new Set(termsTypes.map(type => type.trim()).filter(Boolean))]
  const entries = await Promise.all(
    unique.map(async termsType => {
      const meta = await fetchCurrentTermsDocumentMeta(termsType)
      return [termsType, meta] as const
    })
  )

  const map = new Map<string, CurrentTermsDocumentMeta>()
  for (const [termsType, meta] of entries) {
    if (meta) map.set(termsType, meta)
  }
  return map
}
