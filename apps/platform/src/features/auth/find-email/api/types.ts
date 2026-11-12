export type EmailRecoveryLookupRequest = {
  identityVerificationSessionId: number
  profileToken: string
}

/** 본인인증으로 찾은 계정 — 화면 표시에 쓰는 이메일 값만 남긴다. */
export type EmailRecoveryAccount = {
  /** 본인인증을 마친 회원 본인의 이메일 원문 */
  email?: string
  maskedEmail?: string
}

export type EmailRecoveryLookupResponse = {
  matched?: boolean
  maskedEmail?: string
  accounts?: EmailRecoveryAccount[]
}

/** 이메일 찾기 완료 화면은 본인인증 후 이메일 전체를 보여 준다(개인정보 마스킹 정책 10/26, 사용자 플랫폼 3). */
export type FindEmailLookupResult =
  | { kind: 'found'; email: string }
  | { kind: 'not_found' }
