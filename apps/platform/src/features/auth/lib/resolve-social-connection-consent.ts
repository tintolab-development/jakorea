import { axiosClient } from '@/shared/api/axios-instance'
import { getAccessToken } from '@/shared/lib'
import {
  hasSocialConnectionConsent,
  type SocialConnectionConsentSummary,
} from './has-social-connection-consent'

function unwrapEnvelope<T>(payload: unknown): T {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>
    if (record.success === true && 'data' in record) {
      return unwrapEnvelope<T>(record.data)
    }
  }
  return payload as T
}

let agreedInSession = false

export function markSocialConnectionConsentAgreed() {
  agreedInSession = true
}

export async function resolveHasSocialConnectionConsent(hasLinkedAccount: boolean): Promise<boolean> {
  if (hasLinkedAccount || agreedInSession) return true
  if (!getAccessToken()) return false

  try {
    const res = await axiosClient.get('/api/portal/me/consents')
    const data = unwrapEnvelope<unknown>(res.data)
    const summaries = Array.isArray(data) ? (data as SocialConnectionConsentSummary[]) : []
    const agreed = hasSocialConnectionConsent({ summaries, hasLinkedAccount: false })
    if (agreed) agreedInSession = true
    return agreed
  } catch {
    return false
  }
}
