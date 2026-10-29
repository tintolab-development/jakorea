import type { PortalConsentDocumentCreateRequest } from '../api/portal-consent-documents.types'

/**
 * 마이페이지 초상권 create.
 * `POST /api/portal/me/consents/documents`는 로그인 회원 본인 문서다.
 * `targetType: MEMBER`는 `PORTAL_CONSENT_TARGET_TYPE_INVALID`로 거절되므로 보내지 않는다.
 */
export function buildPortalPortraitRightsConsentCreateRequest(
  /**
   * 미성년 프로그램 신청 — 프로그램 단위 초상권 동의서 (`targetType: PROGRAM`).
   * TODO(BE): 현재 PROGRAM 대상 create 는 신청(참여) 이력이 없으면 403 `PORTAL_CONSENT_PROGRAM_NOT_OWNED`.
   * 신청 전 작성 허용 여부는 BE 회신 후 맞춘다.
   */
  programTarget?: { programId: number },
): PortalConsentDocumentCreateRequest {
  if (programTarget) {
    return { consentType: 'PORTRAIT_RIGHTS', targetType: 'PROGRAM', targetId: programTarget.programId }
  }
  return { consentType: 'PORTRAIT_RIGHTS' }
}
