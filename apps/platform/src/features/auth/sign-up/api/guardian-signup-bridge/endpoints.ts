export const guardianSignupBridgePaths = {
  signupIntents: () => '/api/portal/auth/signup/intents',
  guardianSessions: () => '/api/auth/verification-sessions/guardian',
  guardianConsent: (sessionId: number) =>
    `/api/auth/verification-sessions/guardian/${sessionId}/consent`,
  guardianNiceStart: (sessionId: number) =>
    `/api/auth/verification-sessions/guardian/${sessionId}/nice/start`,
  guardianSignupStatus: (sessionId: number) =>
    `/api/auth/verification-sessions/guardian/${sessionId}/signup-status`,
} as const
