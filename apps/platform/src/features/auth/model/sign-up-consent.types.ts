export type SignUpConsentState = {
  serviceTerms: boolean
  privacyCollection: boolean
  mfaSetup: boolean
  marketing: boolean
}

export type SignUpConsentFieldKey = keyof SignUpConsentState
