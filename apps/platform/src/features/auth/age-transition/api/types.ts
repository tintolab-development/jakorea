export type AgeTransitionChoice = 'LATER' | 'TRANSITION'

export type AgeTransitionPortalStatusCode =
  | 'COMPLETED'
  | 'EVIDENCE_PENDING'
  | 'POLICY_HOLD'
  | 'VERIFICATION_REQUIRED'
  | 'NOT_ELIGIBLE'
  | string

export type AgeTransitionPortalStatus = {
  status?: AgeTransitionPortalStatusCode | null
  transitionedAt?: string | null
  noticePending?: boolean | null
  guardianPersonalDataDeleted?: boolean | null
  identityVerificationRequired?: boolean | null
  choice?: AgeTransitionChoice | string | null
  signupAgeOrigin?: string | null
  signupUnder14?: boolean | null
  eligible?: boolean | null
  completed?: boolean | null
  convertedAt?: string | null
}

export type AgeTransitionChoiceResult = {
  choice?: AgeTransitionChoice | string | null
  transitionSelected?: boolean | null
  guardianPersonalDataDeleted?: boolean | null
  status?: AgeTransitionPortalStatusCode | null
}

export type AgeTransitionNiceSessionStatus = {
  sessionId?: number | null
  provider?: string | null
  status?: string | null
  failureCode?: string | null
  verifiedAt?: string | null
  expiresAt?: string | null
  usedAt?: string | null
}

export type AgeTransitionNiceValidateResult = {
  status?: string | null
  identityVerified?: boolean | null
  transitionCompleted?: boolean | null
}

export type AgeTransitionCompleteRequest = {
  sessionId: number
  marketingAgreed?: boolean | null
}

export type AgeTransitionCompletionResult = {
  status?: AgeTransitionPortalStatusCode | null
  completed?: boolean | null
  evidencePending?: boolean | null
  guardianConsentRowsDeleted?: number | null
  filePiiCleanupStatus?: string | null
}

export class AgeTransitionApiError extends Error {
  readonly code: string
  readonly httpStatus?: number

  constructor(code: string, message: string, httpStatus?: number) {
    super(message)
    this.name = 'AgeTransitionApiError'
    this.code = code
    this.httpStatus = httpStatus
  }
}
