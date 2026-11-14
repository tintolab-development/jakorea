/** 서버 purpose. RECEIPT_PRE_CONSENT = 만 14세 미만 영수증 사전동의(programId 없음, 회원 전역) */
export type PortraitGuardianVerificationPurpose =
  | 'PORTRAIT_RIGHTS'
  | 'PROGRAM_APPLICATION'
  | 'RECEIPT_PRE_CONSENT'

export type PortraitGuardianVerificationResult = {
  /** ISO-8601 (offset 포함) */
  verifiedAt: string
  /**
   * 동의서 서명 complete `guardianVerificationToken`.
   * 화면·로그에 출력하지 않는다.
   */
  verificationToken?: string
}
