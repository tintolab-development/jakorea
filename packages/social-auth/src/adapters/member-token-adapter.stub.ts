import type { SocialAuthAdapter } from './index'

/**
 * Platform(회원) 확장용 스텁 — 백엔드 token 교환 전략 확정 후 구현합니다.
 * - `POST /api/auth/social/login` (accessToken 기반)
 * - 또는 BFF code exchange endpoint
 */
export function createMemberTokenAdapterStub(): SocialAuthAdapter {
  return {
    async completeCallback() {
      throw new Error('memberTokenAdapter는 아직 구현되지 않았습니다.')
    },
  }
}
