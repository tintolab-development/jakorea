import type { PortalConsentDocumentCreateRequest } from '../api/portal-consent-documents.types'

/**
 * 마이페이지 초상권 create.
 * `POST /api/portal/me/consents/documents`는 로그인 회원 본인 문서다.
 * `targetType: MEMBER`는 `PORTAL_CONSENT_TARGET_TYPE_INVALID`로 거절되므로 보내지 않는다.
 */
export function buildPortalPortraitRightsConsentCreateRequest(
  /**
   * 미성년 프로그램 신청 — 프로그램 단위 초상권 동의서 (`targetType: PROGRAM`).
   * 공개 프로그램이면 신청 전 create 허용. `PORTAL_CONSENT_PROGRAM_NOT_OWNED` 는 없는 프로그램일 때만.
   */
  programTarget?: { programId: number },
): PortalConsentDocumentCreateRequest {
  if (programTarget) {
    return { consentType: 'PORTRAIT_RIGHTS', targetType: 'PROGRAM', targetId: programTarget.programId }
  }
  return { consentType: 'PORTRAIT_RIGHTS' }
}
