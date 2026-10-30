export const ageTransitionPaths = {
  status: () => '/api/portal/me/age-transition',
  choice: () => '/api/portal/me/age-transition/choice',
  niceStart: () => '/api/portal/me/age-transition/nice/start',
  niceStatus: (sessionId: number) => `/api/portal/me/age-transition/nice/${sessionId}`,
  niceValidate: (sessionId: number) => `/api/portal/me/age-transition/nice/${sessionId}/validate`,
  complete: () => '/api/portal/me/age-transition/complete',
} as const
