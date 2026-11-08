export const SOCIAL_CONNECTION_CONSENT_TYPE = 'SOCIAL_CONNECTION'

export type SocialConnectionConsentSummary = {
  consentType?: string
  agreed?: boolean
  status?: string
  expired?: boolean
  reconsentRequired?: boolean
}

function isSocialConnectionType(value: string | undefined): boolean {
  return value?.trim().toUpperCase() === SOCIAL_CONNECTION_CONSENT_TYPE
}

/** GET /me/consents의 SOCIAL_CONNECTION 행 또는 이미 연결된 소셜 계정이 있으면 재동의 팝업을 생략한다. */
export function hasSocialConnectionConsent(input: {
  summaries: readonly SocialConnectionConsentSummary[]
  hasLinkedAccount: boolean
}): boolean {
  if (input.hasLinkedAccount) return true

  const row = input.summaries.find(summary => isSocialConnectionType(summary.consentType))
  if (!row) return false
  if (row.expired === true || row.reconsentRequired === true) return false
  if ((row.status ?? '').trim().toUpperCase() === 'WITHDRAWN') return false
  return row.agreed === true
}
