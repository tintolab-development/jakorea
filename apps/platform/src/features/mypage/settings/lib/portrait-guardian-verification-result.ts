export type PortraitGuardianVerificationPurpose = 'PORTRAIT_RIGHTS' | 'PROGRAM_APPLICATION'

export type PortraitGuardianVerificationResult = {
  /** ISO-8601 (offset 포함) */
  verifiedAt: string
  /**
   * 동의서 서명 complete `guardianVerificationToken`.
   * 화면·로그에 출력하지 않는다.
   */
  verificationToken?: string
}
