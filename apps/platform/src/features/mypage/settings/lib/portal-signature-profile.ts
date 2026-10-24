import type { PortalSignatureProfileRequest } from '../api/portal-consent-documents.types'

/** 서버가 승인한 `PUT /api/portal/me/signatures/current` 유형. `TYPED`는 `PORTAL_SIGNATURE_TYPE_INVALID`. */
export const PORTAL_SIGNATURE_TYPE_DRAWN = 'DRAWN'

/** 그리기·타이핑 모두 PNG 업로드 후 동일 계약. displayName·fontStyleCode는 보내지 않는다. */
export function buildPortalSignatureProfileRequest(
  fileObjectId: number,
): PortalSignatureProfileRequest {
  return {
    signatureType: PORTAL_SIGNATURE_TYPE_DRAWN,
    fileObjectId,
  }
}
