import type { NewsletterSubscribeResponse } from './newsletter-client'

function readStatusMessage(payload: unknown): NewsletterSubscribeResponse {
  if (!payload || typeof payload !== 'object') return {}
  const record = payload as Record<string, unknown>
  return {
    status: typeof record.status === 'string' ? record.status : undefined,
    message: typeof record.message === 'string' ? record.message : undefined,
  }
}

/** 202 본문 { status, message }. HTTP·envelope.data 로 성공 판단하지 않음. */
export function parseNewsletterSubscribeResponse(
  payload: unknown,
): NewsletterSubscribeResponse {
  const direct = readStatusMessage(payload)
  if (direct.status) return direct

  if (payload && typeof payload === 'object' && 'data' in payload) {
    const nested = readStatusMessage((payload as { data?: unknown }).data)
    if (nested.status) return nested
  }

  return direct
}
