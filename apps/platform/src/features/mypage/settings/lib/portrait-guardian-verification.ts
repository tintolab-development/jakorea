import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'

/**
 * 만 14세 미만 회원 초상권 동의 — 보호자(법정대리인) 본인인증 어댑터.
 *
 * TODO(BE): 실 API 미연결. BE 확정 후 아래 흐름으로 교체한다.
 *  1) POST /api/portal/me/guardian-verifications { purpose, guardianRelation, programId? }
 *     - 마이페이지 초상권: purpose 'PORTRAIT_RIGHTS'
 *     - 미성년 프로그램 신청: purpose 'PROGRAM_APPLICATION' + programId (신청 시도마다 새로 인증)
 *  2) POST .../{sessionId}/nice/start → authUrl 로 NICE 팝업
 *  3) GET .../{sessionId} 폴링 → VERIFIED 시 { verifiedAt, verificationToken }
 *  verificationToken 은 초상권 동의서 서명 complete 요청에 전달해야 한다.
 *  회원가입용 보호자 bridge API 는 호출하지 않는다.
 */

export type PortraitGuardianVerificationPurpose = 'PORTRAIT_RIGHTS' | 'PROGRAM_APPLICATION'

export type PortraitGuardianVerificationResult = {
  /** ISO-8601 (offset 포함) */
  verifiedAt: string
  /**
   * 동의서 서명 complete 에 넘길 인증 토큰. TODO(BE): 필드명·전달 위치 확정 전 — 실 API 연결 시 채운다.
   * 화면·로그에 출력하지 않는다.
   */
  verificationToken?: string
}

export const PORTRAIT_GUARDIAN_VERIFICATION_UNAVAILABLE_MESSAGE =
  '보호자 본인인증을 지금 진행할 수 없어요. 잠시 후 다시 시도해 주세요.'

export class PortraitGuardianVerificationUnavailableError extends Error {
  constructor() {
    super(PORTRAIT_GUARDIAN_VERIFICATION_UNAVAILABLE_MESSAGE)
    this.name = 'PortraitGuardianVerificationUnavailableError'
  }
}

/** 로컬 dev mock(원격 API 미설정)에서만 인증 성공을 흉내 낸다. */
function isPortraitGuardianVerificationMockMode(): boolean {
  return import.meta.env.DEV && !isRemoteApiConfigured()
}

const MOCK_DELAY_MS = 400

export async function startPortraitGuardianVerification(input: {
  relation: string
  /** 기본값: `PORTRAIT_RIGHTS` (마이페이지) */
  purpose?: PortraitGuardianVerificationPurpose
  /** `PROGRAM_APPLICATION` 일 때 대상 프로그램 */
  programId?: number
}): Promise<PortraitGuardianVerificationResult> {
  void input.relation
  void input.purpose
  void input.programId
  if (isPortraitGuardianVerificationMockMode()) {
    await new Promise(resolve => setTimeout(resolve, MOCK_DELAY_MS))
    return { verifiedAt: new Date().toISOString() }
  }
  throw new PortraitGuardianVerificationUnavailableError()
}
