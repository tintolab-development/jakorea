export interface IdentityVerificationStartRequest {
  provider?: string
  expectedName?: string
  expectedBirthDate?: string
  expectedPhone?: string
  flow?: string
  frontendReturnUrl?: string
  state?: string
}

export interface NiceIdentityAuthStartResponse {
  sessionId?: number
  provider?: string
  providerTxId?: string
  status?: string
  expiresAt?: string
  authUrl?: string
  requestNo?: string
  transactionId?: string
  flow?: string
  frontendReturnUrl?: string
  state?: string
}

export interface IdentityVerificationSessionResponse {
  sessionId?: number
  sessionUuid?: string
  provider?: string
  status?: string
  verifiedAt?: string
  expiresAt?: string
  usedAt?: string
  verifiedName?: string
  verifiedPhone?: string
  verifiedBirthDate?: string
}

export interface IdentityChallengeStartInput {
  birthDate?: string
  gender?: string
  name?: string
}

export interface IdentityChallengeStartResult {
  sessionId: number
  authUrl: string
  expiresAt: string
}

export interface IdentityChallengeCompleteInput {
  sessionId: number
  webTransactionId: string
  birthDate?: string
  gender?: string
}

export interface IdentityChallengeCompleteResult {
  sessionId: number
  sessionUuid?: string
  profileToken?: string
  verifiedName?: string
  verifiedPhone?: string
  verifiedBirthDate?: string
  verifiedAt: string
}

export interface IdentityVerifiedPayload {
  type: 'IDENTITY_VERIFIED'
  sessionId: number
  sessionUuid?: string
  profileToken?: string
  verifiedName?: string
  verifiedPhone?: string
  verifiedBirthDate?: string
  verifiedAt: string
}

export interface IdentityFailedPayload {
  type: 'IDENTITY_FAILED'
  message?: string
}

export interface IdentityCancelledPayload {
  type: 'IDENTITY_CANCELLED'
}

export type IdentityMessage =
  | IdentityVerifiedPayload
  | IdentityFailedPayload
  | IdentityCancelledPayload

export interface PendingIdentityChallenge {
  sessionId: number
  nonce: string
  birthDate?: string
  gender?: string
  name?: string
}

export interface VerifiedIdentityProfileResponse {
  sessionId?: number
  provider?: string
  status?: string
  flow?: string
  name?: string
  phone?: string
  birthDate?: string
  birthDateRaw?: string
  gender?: string
  genderLabel?: string
  nationalInfo?: string
  mobileCarrier?: string
  verifiedAt?: string
  expiresAt?: string
  usedAt?: string
}

export interface IdentityVerificationPaths {
  niceStart: () => string
  identitySession: (sessionId: number) => string
  identityProfile: (sessionId: number, profileToken: string) => string
}

/** 앱 라우터에 등록할 콜백·mock 경로 (origin 제외) */
export interface IdentityVerificationRoutes {
  callbackPath: string
  mockPath: string
}

export interface IdentityVerificationHttpClient {
  post<T = unknown>(url: string, body: unknown): Promise<{ data: T }>
  get<T = unknown>(url: string): Promise<{ data: T }>
}

export type IdentityCallbackOutcome =
  | { kind: 'verified'; payload: IdentityVerifiedPayload }
  | { kind: 'failed'; message: string; noOpener: boolean }
  | { kind: 'cancelled' }
