import { describe, expect, it } from 'vitest'
import { isAuditLogUnavailableError, isForbiddenApiError } from './privacy-audit-error'

function axiosError(status: number, code?: string): unknown {
  return {
    response: {
      status,
      data: code ? { error: { code } } : {},
    },
  }
}

describe('privacy audit error', () => {
  it('matches 503 AUDIT_LOG_UNAVAILABLE only', () => {
    expect(isAuditLogUnavailableError(axiosError(503, 'AUDIT_LOG_UNAVAILABLE'))).toBe(true)
    expect(isAuditLogUnavailableError(axiosError(503, 'PROVIDER_UNAVAILABLE'))).toBe(false)
    expect(isAuditLogUnavailableError(axiosError(500, 'AUDIT_LOG_UNAVAILABLE'))).toBe(false)
  })

  it('matches HTTP 403', () => {
    expect(isForbiddenApiError(axiosError(403))).toBe(true)
    expect(isForbiddenApiError(axiosError(401))).toBe(false)
  })
})
