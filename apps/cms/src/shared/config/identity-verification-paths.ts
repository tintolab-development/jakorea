export const identityVerificationPaths = {
  niceStart: () => '/api/auth/verification-sessions/identity/nice/start',
  identitySession: (sessionId: number) =>
    `/api/auth/verification-sessions/identity/${sessionId}`,
  identityProfile: (sessionId: number, profileToken: string) => {
    const params = new URLSearchParams({ profileToken })
    return `/api/auth/verification-sessions/identity/${sessionId}/profile?${params.toString()}`
  },
} as const
