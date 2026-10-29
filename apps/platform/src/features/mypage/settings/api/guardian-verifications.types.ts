export type MemberGuardianVerificationPurpose = 'PORTRAIT_RIGHTS' | 'PROGRAM_APPLICATION'

export type MemberGuardianVerificationStatus =
  | 'PENDING'
  | 'NICE_STARTED'
  | 'VERIFIED'
  | 'FAILED'
  | 'EXPIRED'

export type CreateMemberGuardianVerificationRequest = {
  purpose: MemberGuardianVerificationPurpose
  guardianRelation: string
  programId?: number
  frontendReturnUrl?: string
}

export type CreateMemberGuardianVerificationResponse = {
  sessionId: number
  statusToken: string
  status?: MemberGuardianVerificationStatus
  expiresAt?: string
}

export type StartMemberGuardianVerificationNiceRequest = {
  frontendReturnUrl?: string
}

export type StartMemberGuardianVerificationNiceResponse = {
  sessionId?: number
  authUrl?: string
  requestNo?: string
  transactionId?: string
  flow?: string
  statusToken?: string
  expiresAt?: string
}

export type GetMemberGuardianVerificationResponse = {
  status?: MemberGuardianVerificationStatus
  verifiedAt?: string
  failureCode?: string
  /** VERIFIED 첫 성공 조회에서만 1회. 화면·로그에 출력하지 않는다. */
  verificationToken?: string
  tokenExpiresAt?: string
  message?: string
}
