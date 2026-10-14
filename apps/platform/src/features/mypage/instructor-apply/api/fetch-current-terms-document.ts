import type { InternalAxiosRequestConfig } from 'axios'
import { axiosClient } from '@/shared/api/axios-instance'

export type CurrentTermsDocumentMeta = {
  version: string
}

type SkipAuthConfig = InternalAxiosRequestConfig & {
  skipAuth?: boolean
  skipRefresh?: boolean
}

const SKIP_AUTH: SkipAuthConfig = {
  skipAuth: true,
  skipRefresh: true,
} as SkipAuthConfig

/** OpenAPI — PAYMENT_STATEMENT_PRE_CONSENT ↔ PAYMENT_STATEMENT_CONSENT 정규화 */
const PAYMENT_STATEMENT_ALIAS_GROUP = [
  'PAYMENT_STATEMENT_CONSENT',
  'PAYMENT_STATEMENT_PRE_CONSENT',
  'PAYMENT_STATEMENT',
] as const

function unwrapEnvelope(payload: unknown): Record<string, unknown> | null {
  if (!payload || typeof payload !== 'object') return null
  const root = payload as Record<string, unknown>
  if (root.success === true && root.data && typeof root.data === 'object') {
    return unwrapEnvelope(root.data)
  }
  return root
}

function resolveTermsTypesForCurrentLookup(termsType: string): string[] {
  const normalized = termsType.trim().toUpperCase()
  if (!normalized) return []
  if (PAYMENT_STATEMENT_ALIAS_GROUP.some(type => type === normalized)) {
    return [...new Set([normalized, ...PAYMENT_STATEMENT_ALIAS_GROUP])]
  }
  return [normalized]
}

async function fetchCurrentTermsDocumentMetaByType(
  termsType: string,
): Promise<CurrentTermsDocumentMeta | null> {
  try {
    const { data } = await axiosClient.get<unknown>(
      `/api/public/terms-documents/${encodeURIComponent(termsType)}/current`,
      SKIP_AUTH,
    )
    const doc = unwrapEnvelope(data)
    const version = typeof doc?.version === 'string' ? doc.version.trim() : ''
    if (!version) return null
    return { version }
  } catch {
    return null
  }
}

export async function fetchCurrentTermsDocumentMeta(
  termsType: string,
): Promise<CurrentTermsDocumentMeta | null> {
  for (const candidate of resolveTermsTypesForCurrentLookup(termsType)) {
    const meta = await fetchCurrentTermsDocumentMetaByType(candidate)
    if (meta != null) return meta
  }
  return null
}

export async function fetchCurrentTermsDocumentsMetaMap(
  termsTypes: string[],
): Promise<Map<string, CurrentTermsDocumentMeta>> {
  const unique = [...new Set(termsTypes.map(type => type.trim()).filter(Boolean))]
  const entries = await Promise.all(
    unique.map(async termsType => {
      const meta = await fetchCurrentTermsDocumentMeta(termsType)
      return [termsType, meta] as const
    }),
  )

  const map = new Map<string, CurrentTermsDocumentMeta>()
  for (const [termsType, meta] of entries) {
    if (meta) map.set(termsType, meta)
  }
  return map
}
