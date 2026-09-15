export type EmailRecoveryLookupRequest = {
  identityVerificationSessionId: number
  profileToken: string
}

export type EmailRecoveryLookupResponse = {
  matched?: boolean
  maskedEmail?: string
}

export type FindEmailLookupResult =
  | { kind: 'found'; maskedEmail: string }
  | { kind: 'not_found' }
