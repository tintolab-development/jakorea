import type { PortalConsentDocumentCreateRequest } from '../api/portal-consent-documents.types'

/**
 * 마이페이지 초상권 create.
 * `POST /api/portal/me/consents/documents`는 로그인 회원 본인 문서다.
 * `targetType: MEMBER`는 `PORTAL_CONSENT_TARGET_TYPE_INVALID`로 거절되므로 보내지 않는다.
 */
export function buildPortalPortraitRightsConsentCreateRequest(): PortalConsentDocumentCreateRequest {
  return { consentType: 'PORTRAIT_RIGHTS' }
}
