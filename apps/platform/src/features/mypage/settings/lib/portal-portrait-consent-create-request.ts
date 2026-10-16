import { getPortalMe } from '@/features/auth/sign-in'
import type { PortalConsentDocumentCreateRequest } from '../api/portal-consent-documents.types'

/** Portal consent document create — 회원 단위 초상권 대상 */
export const PORTAL_PORTRAIT_CONSENT_TARGET_TYPE = 'MEMBER'

export async function buildPortalPortraitRightsConsentCreateRequest(
  memberId?: number,
): Promise<PortalConsentDocumentCreateRequest> {
  const resolvedId =
    memberId ??
    (await getPortalMe().then(me => me.memberId))

  if (resolvedId == null || !Number.isFinite(resolvedId) || resolvedId <= 0) {
    throw new Error('회원 정보를 확인할 수 없습니다.')
  }

  return {
    consentType: 'PORTRAIT_RIGHTS',
    targetType: PORTAL_PORTRAIT_CONSENT_TARGET_TYPE,
    targetId: resolvedId,
  }
}
