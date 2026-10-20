import { axiosClient } from '@/shared/api/axios-instance'

const PORTAL_CONSENTS_PATH = '/api/portal/me/consents'
const PORTAL_MARKETING_CONSENT_PATH = '/api/portal/me/marketing-consent'

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
  /** 초상권 — `PARTIAL` | `DISAGREED` (FULL 없음) */
  consentStatus?: string
  /** 초상권 — 프로그램 참여 게이트는 이 값만 사용 */
  programEligible?: boolean
}

/** PUT /api/portal/me/marketing-consent — PortalMarketingConsentUpdateRequest */
export type PortalMarketingConsentUpdateRequest = {
  agreed: boolean
  version?: string
  reason?: string
}

/** PUT /api/portal/me/marketing-consent — PortalMarketingConsentResponse */
export type PortalMarketingConsentResponse = {
  consentType?: string
  agreed?: boolean
  agreedAt?: string | null
  withdrawnAt?: string | null
  updatedAt?: string
  version?: string
}

/** 철회 응답 — MemberPortalConsentMutationResponse */
export type PortalConsentMutationResponse = {
  documentId?: number | null
  consentType?: string
  status?: string
  changedAt?: string
}

/** documentId 없이 유형으로 철회 가능한 항목 */
export const TYPE_WITHDRAWABLE_CONSENT_TYPES = ['PORTRAIT_RIGHTS', 'CHILD_PRIVACY_COLLECTION'] as const

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
export async function withdrawPortalConsentDocument(
  documentId: number,
  reason: string,
): Promise<PortalConsentMutationResponse> {
  const res = await axiosClient.post(
    `${PORTAL_CONSENTS_PATH}/documents/${encodeURIComponent(String(documentId))}/withdraw`,
    { reason },
  )
  return unwrapEnvelope<PortalConsentMutationResponse>(res.data) ?? {}
}

/** POST /api/portal/me/consents/{consentType}/withdraw — 문서 없는 초상권·아동개인정보 철회 */
export async function withdrawPortalConsentByType(
  consentType: (typeof TYPE_WITHDRAWABLE_CONSENT_TYPES)[number],
  reason: string,
): Promise<PortalConsentMutationResponse> {
  const res = await axiosClient.post(
    `${PORTAL_CONSENTS_PATH}/${encodeURIComponent(consentType)}/withdraw`,
    { reason },
  )
  return unwrapEnvelope<PortalConsentMutationResponse>(res.data) ?? {}
}

/** PUT /api/portal/me/marketing-consent — 마케팅 동의·철회 (profile PATCH 사용 금지) */
export async function putPortalMarketingConsent(
  body: PortalMarketingConsentUpdateRequest,
): Promise<PortalMarketingConsentResponse> {
  const res = await axiosClient.put(PORTAL_MARKETING_CONSENT_PATH, body)
  return unwrapEnvelope<PortalMarketingConsentResponse>(res.data) ?? {}
}

export async function fetchPortalConsents(signal?: AbortSignal): Promise<PortalConsentSummary[]> {
  const res = await axiosClient.get(PORTAL_CONSENTS_PATH, { signal })
  const data = unwrapEnvelope<unknown>(res.data)
  return Array.isArray(data) ? (data as PortalConsentSummary[]) : []
}

/** GET /api/portal/me/consents/documents/{documentId} — 제출 동의서 조회 */
export type PortalConsentDocumentDetail = {
  documentId?: number
  consentType?: string
  title?: string
  contentFormat?: string
  /** 성범죄 업로드 파일 URL·data URL */
  content?: string
  schemaJson?: unknown
  renderStatus?: string
  /** 문서 서명·제출 시각 */
  signedAt?: string
  signedFileObjectId?: number
  evidenceFileObjectId?: number
  evidenceOriginalFileName?: string
  filledDocument?: {
    templateCode?: string
    schemaJson?: unknown
    paymentBasicInfo?: Record<string, unknown>
    evidenceFileObjectId?: number
    evidenceOriginalFileName?: string
  } | null
}

export async function fetchPortalConsentDocument(
  documentId: number,
  signal?: AbortSignal,
): Promise<PortalConsentDocumentDetail> {
  const res = await axiosClient.get(
    `${PORTAL_CONSENTS_PATH}/documents/${encodeURIComponent(String(documentId))}`,
    { signal },
  )
  return unwrapEnvelope<PortalConsentDocumentDetail>(res.data) ?? {}
}
