export type SignupIntentCreateRequest = {
  memberType: 'GENERAL' | 'TEACHER'
  birthDate: string
  gender: string
}

export type SignupIntentCreateResponse = {
  intentId?: string
  memberType?: string
  ageGroup?: string
  status?: string
  guardianRequired?: boolean
  expiresAt?: string
}

/**
 * ① 챌린지 — 보호자 이름·휴대폰·관계는 보내지 않는다(NICE 결과와 최종 동의에서 받는다).
 */
export type GuardianChallengeCreateRequest = {
  provider: 'NICE'
  signupIntentId: string
}

export type GuardianChallengeCreateResponse = {
  sessionId?: number
  providerTxId?: string
  statusToken?: string
  status?: string
  expiresAt?: string
}

/**
 * ② 약관 동의: `{ agreed, termsVersion }`만 보낸다.
 * ⑤ 최종 동의: 관계와 `finalConsentToken`을 함께 보낸다.
 */
export type GuardianConsentRequest = {
  agreed: boolean
  termsVersion: string
  guardianRelation?: string
  finalConsentToken?: string
}

export type GuardianConsentResponse = {
  status?: string
  explicitConsentRecorded?: boolean
  explicitConsentAt?: string
  expiresAt?: string
}

export type GuardianNiceStartResponse = {
  sessionId?: number
  authUrl?: string
  requestNo?: string
  transactionId?: string
  flow?: string
}

export type GuardianSignupStatusResponse = {
  guardianSessionId?: number
  status?: string
  explicitConsentRecorded?: boolean
  identityVerified?: boolean
  niceStartState?: string
  explicitConsentAt?: string
  expiresAt?: string
  usedAt?: string
  /** NICE로 확인된 보호자 이름(마스킹 없음). 화면 표시용으로만 쓰고 저장하지 않는다. */
  verifiedGuardianName?: string | null
  /** NICE로 확인된 보호자 휴대폰 — 숫자만, 마스킹 없음. 화면 표시용으로만 쓴다. */
  verifiedGuardianPhone?: string | null
  /** 저장된 보호자 관계. 최종 동의 전이면 null */
  guardianRelation?: string | null
}

export type GuardianFinalConsentChallengeResponse = {
  challengeToken?: string
  expiresAt?: string
}
