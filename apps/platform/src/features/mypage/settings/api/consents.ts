import { axiosClient } from '@/shared/api/axios-instance'

const PORTAL_CONSENTS_PATH = '/api/portal/me/consents'

/** GET /api/portal/me/consents 항목 — MemberPortalConsentSummary */
export type PortalConsentSummary = {
  consentType?: string
  title?: string
  applicable?: boolean
  required?: boolean
  agreed?: boolean
  signed?: boolean
  status?: string
  agreedAt?: string
  expiresAt?: string
  expired?: boolean
  withdrawable?: boolean
  reconsentRequired?: boolean
  documentId?: number
  consentStatus?: string
  programEligible?: boolean
}

function unwrapEnvelope<T>(payload: unknown): T {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>
    if (record.success === true && 'data' in record) {
      return unwrapEnvelope<T>(record.data)
    }
  }
  return payload as T
}

/** POST /api/portal/me/consents/documents/{documentId}/withdraw — 전자서명 동의 철회 */
export async function withdrawPortalConsentDocument(documentId: number, reason: string) {
  await axiosClient.post(
    `${PORTAL_CONSENTS_PATH}/documents/${encodeURIComponent(String(documentId))}/withdraw`,
    { reason },
  )
}

export async function fetchPortalConsents(signal?: AbortSignal): Promise<PortalConsentSummary[]> {
  const res = await axiosClient.get(PORTAL_CONSENTS_PATH, { signal })
  const data = unwrapEnvelope<unknown>(res.data)
  return Array.isArray(data) ? (data as PortalConsentSummary[]) : []
}
