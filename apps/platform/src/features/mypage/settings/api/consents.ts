import { axiosClient } from '@/shared/api/axios-instance'
import { type TypeWithdrawableConsentType } from '../lib/consent-withdraw'

export {
  FIVE_POLICY_CONSENT_TYPES,
  TYPE_WITHDRAWABLE_CONSENT_TYPES,
  type TypeWithdrawableConsentType,
} from '../lib/consent-withdraw'

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
  /**
   * RECEIPT_PRE_CONSENT / PAYMENT_STATEMENT_CONSENT / FACILITATOR_PLEDGE /
   * ADMINISTRATIVE_INFO_CONSENT / CRIMINAL_HISTORY_CHECK_CONSENT 만 boolean.
   * 그 외 타입은 omit/null — true로 정규화하지 않는다.
   */
  listed?: boolean | null
  status?: string
  agreedAt?: string
  expiresAt?: string
  expired?: boolean
  withdrawable?: boolean
  participationRestricted?: boolean
  paymentRestricted?: boolean
  reconsentRequired?: boolean
  /** 약관/문서 버전이 올라가 재동의가 필요한 상태 */
  policyUpdated?: boolean
  documentId?: number | null
  /** 초상권 — `PARTIAL` | `DISAGREED` (FULL 없음) */
  consentStatus?: string
  /** 초상권 — 프로그램 참여 게이트는 이 값만 사용 */
  programEligible?: boolean
  /**
   * 초상권 — 1·2·3번 모두 agree면 true(제출 시점 스냅샷). 비초상권·판정 불가 기록은 null.
   * 라벨(동의/부분 동의) 전용. 참여 여부 판단·요청 바디에 쓰지 않는다.
   */
  allItemsAgreed?: boolean | null
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

/** 철회 응답 — MemberPortalConsentMutationResponse. `documentId: null`은 정상 성공. */
export type PortalConsentMutationResponse = {
  documentId?: number | null
  consentType?: string
  status?: string
  changedAt?: string
}

/** POST withdraw body — MemberPortalConsentWithdrawRequest */
export type PortalConsentWithdrawRequest = {
  reason?: string | null
}

export type PortalConsentWithdrawOptions = {
  reason?: string | null
  idempotencyKey?: string
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

function withdrawRequestBody(reason?: string | null): PortalConsentWithdrawRequest {
  const trimmed = reason?.trim() ?? ''
  if (!trimmed) return {}
  return { reason: trimmed.slice(0, 500) }
}

function withdrawRequestConfig(options?: PortalConsentWithdrawOptions) {
  const idempotencyKey = options?.idempotencyKey?.trim()
  return idempotencyKey ? { headers: { 'Idempotency-Key': idempotencyKey } } : undefined
}

/** POST /api/portal/me/consents/documents/{documentId}/withdraw — 전자서명 동의 철회 */
export async function withdrawPortalConsentDocument(
  documentId: number,
  options?: PortalConsentWithdrawOptions,
): Promise<PortalConsentMutationResponse> {
  const res = await axiosClient.post(
    `${PORTAL_CONSENTS_PATH}/documents/${encodeURIComponent(String(documentId))}/withdraw`,
    withdrawRequestBody(options?.reason),
    withdrawRequestConfig(options),
  )
  return unwrapEnvelope<PortalConsentMutationResponse>(res.data) ?? {}
}

/** POST /api/portal/me/consents/{consentType}/withdraw — 문서 없는 유형 철회 */
export async function withdrawPortalConsentByType(
  consentType: TypeWithdrawableConsentType,
  options?: PortalConsentWithdrawOptions,
): Promise<PortalConsentMutationResponse> {
  const res = await axiosClient.post(
    `${PORTAL_CONSENTS_PATH}/${encodeURIComponent(consentType)}/withdraw`,
    withdrawRequestBody(options?.reason),
    withdrawRequestConfig(options),
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

/**
 * POST /api/portal/me/consents/listed — 동의서·서약서 카드 노출 고정 (listPortalConsentTypes).
 * 동의 효력과 무관하게 해당 유형 `listed`를 true로 만든다. 되돌리는 API는 없다.
 */
export async function listPortalConsentTypes(consentTypes: readonly string[]): Promise<void> {
  await axiosClient.post(`${PORTAL_CONSENTS_PATH}/listed`, { consentTypes })
}

export async function fetchPortalConsents(signal?: AbortSignal): Promise<PortalConsentSummary[]> {
  const res = await axiosClient.get(PORTAL_CONSENTS_PATH, { signal })
  const data = unwrapEnvelope<unknown>(res.data)
  return Array.isArray(data) ? (data as PortalConsentSummary[]) : []
}

/** GET /api/portal/me/consents/{consentType} — 유형 상세 */
export async function fetchPortalConsent(
  consentType: string,
  signal?: AbortSignal,
): Promise<PortalConsentSummary> {
  const res = await axiosClient.get(
    `${PORTAL_CONSENTS_PATH}/${encodeURIComponent(consentType)}`,
    { signal },
  )
  return unwrapEnvelope<PortalConsentSummary>(res.data) ?? {}
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
  signatureFields?: Array<{
    fieldKey?: string
    signed?: boolean
    signatureFileObjectId?: number
    signedAt?: string
  }>
  evidenceFileObjectId?: number
  evidenceOriginalFileName?: string
  filledDocument?: {
    templateVersionId?: number | null
    templateCode?: string
    schemaJson?: unknown
    paymentBasicInfo?: Record<string, unknown>
    evidenceFileObjectId?: number
    evidenceOriginalFileName?: string
  } | null
  /** SIGNED 미리보기에는 쓰지 않는다. 신규 DRAFT 작성 전용. */
  formTemplateVersion?: {
    templateVersionId?: number
    templateCode?: string
    schemaJson?: unknown
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
