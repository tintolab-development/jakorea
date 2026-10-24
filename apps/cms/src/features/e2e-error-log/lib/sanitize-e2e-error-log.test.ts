import { describe, expect, it } from 'vitest'
import {
  REDACTED,
  isAuthSensitiveRequestPath,
  previewForE2eErrorLog,
  redactSensitivePreview,
  scrubE2eErrorLogEntries,
  scrubE2eErrorLogEntry,
} from './sanitize-e2e-error-log'
import type { E2eErrorLogEntry } from '../model/types'

describe('sanitize-e2e-error-log', () => {
  it('refresh 토큰 요청 본문은 기록하지 않는다', () => {
    expect(isAuthSensitiveRequestPath('/api/admin/auth/refresh')).toBe(true)
    expect(
      previewForE2eErrorLog({
        requestPath: '/api/admin/auth/refresh',
        body: { refreshToken: 'rt-plain-secret', grantType: 'refresh_token' },
      })
    ).toBeUndefined()
  })

  it('비밀번호·MFA 필드를 마스킹한다', () => {
    const preview = redactSensitivePreview({
      loginId: 'admin',
      password: 'hunter2',
      mfaCode: '000000',
      otp: '123456',
    })
    expect(preview).toContain(`"password":"${REDACTED}"`)
    expect(preview).toContain(`"mfaCode":"${REDACTED}"`)
    expect(preview).toContain(`"otp":"${REDACTED}"`)
    expect(preview).not.toContain('hunter2')
    expect(preview).not.toContain('000000')
    expect(preview).toContain('admin')
  })

  it('JSON 문자열 본문의 refreshToken도 마스킹한다', () => {
    const preview = redactSensitivePreview(
      JSON.stringify({ refreshToken: 'rt-live', accessToken: 'at-live' })
    )
    expect(preview).not.toContain('rt-live')
    expect(preview).not.toContain('at-live')
    expect(preview).toContain(REDACTED)
  })

  it('이미 저장된 로그를 로드 시 정리한다', () => {
    const dirty: E2eErrorLogEntry = {
      id: '1',
      occurredAt: '2026-10-24T00:00:00.000Z',
      situation: '로그인',
      route: '/login',
      method: 'POST',
      requestPath: '/api/admin/auth/refresh',
      httpStatus: 401,
      errorCode: 'UNAUTHORIZED',
      message: 'expired',
      requestBodyPreview: '{"refreshToken":"keep-me-out"}',
      responseBodyPreview: '{"token":"also-secret"}',
    }
    const scrubbed = scrubE2eErrorLogEntry(dirty)
    expect(scrubbed.requestBodyPreview).toBeUndefined()
    expect(scrubbed.responseBodyPreview).not.toContain('also-secret')
    expect(scrubbed.responseBodyPreview).toContain(REDACTED)
    const { items, changed } = scrubE2eErrorLogEntries([dirty])
    expect(changed).toBe(true)
    expect(items[0]?.requestBodyPreview).toBeUndefined()
  })

  it('일반 API 본문은 그대로 둔다', () => {
    const preview = previewForE2eErrorLog({
      requestPath: '/api/admin/programs/186359',
      body: { title: '[BOT-TEST] overlay' },
    })
    expect(preview).toContain('[BOT-TEST] overlay')
  })
})
