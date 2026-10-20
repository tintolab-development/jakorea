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

export type GuardianChallengeCreateRequest = {
  provider: 'NICE'
  guardianName: string
  guardianPhone: string
  guardianRelation: string
  signupIntentId: string
}

export type GuardianChallengeCreateResponse = {
  sessionId?: number
  providerTxId?: string
  statusToken?: string
  status?: string
  expiresAt?: string
}

export type GuardianConsentRequest = {
  agreed: boolean
  termsVersion: string
  guardianRelation: string
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
  identityVerified?: boolean
  expiresAt?: string
}

export type GuardianFinalConsentChallengeResponse = {
  challengeToken?: string
  expiresAt?: string
}
