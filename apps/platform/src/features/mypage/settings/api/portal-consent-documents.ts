import { axiosClient } from '@/shared/api/axios-instance'
import type {
  PortalConsentCompleteRequest,
  PortalConsentDocumentCreateRequest,
  PortalConsentDocumentDetail,
  PortalConsentSignFieldRequest,
  PortalSignatureProfileRequest,
  PortalSignatureProfileResponse,
} from './portal-consent-documents.types'

const PORTAL_CONSENTS_PATH = '/api/portal/me/consents'
const PORTAL_SIGNATURES_CURRENT = '/api/portal/me/signatures/current'

function unwrapEnvelope<T>(payload: unknown): T {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>
    if (record.success === true && 'data' in record) {
      return unwrapEnvelope<T>(record.data)
    }
  }
  return payload as T
}

export async function createPortalConsentDocument(
  body: PortalConsentDocumentCreateRequest,
): Promise<PortalConsentDocumentDetail> {
  const res = await axiosClient.post(`${PORTAL_CONSENTS_PATH}/documents`, body)
  return unwrapEnvelope<PortalConsentDocumentDetail>(res.data) ?? {}
}

export async function fetchPortalConsentDocumentDetail(
  documentId: number,
  signal?: AbortSignal,
): Promise<PortalConsentDocumentDetail> {
  const res = await axiosClient.get(
    `${PORTAL_CONSENTS_PATH}/documents/${encodeURIComponent(String(documentId))}`,
    { signal },
  )
  return unwrapEnvelope<PortalConsentDocumentDetail>(res.data) ?? {}
}

export async function signPortalConsentDocumentField(
  documentId: number,
  fieldKey: string,
  body: PortalConsentSignFieldRequest,
): Promise<PortalConsentDocumentDetail> {
  const res = await axiosClient.post(
    `${PORTAL_CONSENTS_PATH}/documents/${encodeURIComponent(String(documentId))}/signature-fields/${encodeURIComponent(fieldKey)}/sign`,
    body,
  )
  return unwrapEnvelope<PortalConsentDocumentDetail>(res.data) ?? {}
}

export async function completePortalConsentDocument(
  documentId: number,
  body: PortalConsentCompleteRequest,
): Promise<PortalConsentDocumentDetail> {
  const res = await axiosClient.post(
    `${PORTAL_CONSENTS_PATH}/documents/${encodeURIComponent(String(documentId))}/complete`,
    body,
  )
  return unwrapEnvelope<PortalConsentDocumentDetail>(res.data) ?? {}
}

export async function putPortalSignatureCurrent(
  body: PortalSignatureProfileRequest,
): Promise<PortalSignatureProfileResponse> {
  const res = await axiosClient.put(PORTAL_SIGNATURES_CURRENT, body)
  return unwrapEnvelope<PortalSignatureProfileResponse>(res.data) ?? {}
}
