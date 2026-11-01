import { describe, expect, it } from 'vitest'
import { resolveApplyGate } from '../src/pages/programs/apply/apply-gate'

describe('resolveApplyGate', () => {
  it('returns not-found when program id is not numeric', () => {
    expect(
      resolveApplyGate({
        hasAccessToken: true,
        remoteConfigured: true,
        numericProgramId: null,
        status: 'ready',
      })
    ).toBe('not-found')
  })

  it('returns loading while program detail is loading', () => {
    expect(
      resolveApplyGate({
        hasAccessToken: true,
        remoteConfigured: true,
        numericProgramId: 1,
        status: 'loading',
      })
    ).toBe('loading')
  })

  it('returns login-required without access token (401 submit gate)', () => {
    expect(
      resolveApplyGate({
        hasAccessToken: false,
        remoteConfigured: true,
        numericProgramId: 1,
        status: 'ready',
      })
    ).toBe('login-required')
  })

  it('returns config-error when remote API is not configured (PROD unreachable)', () => {
    expect(
      resolveApplyGate({
        hasAccessToken: true,
        remoteConfigured: false,
        numericProgramId: 1,
        status: 'ready',
      })
    ).toBe('config-error')
  })

  it('returns not-found when detail status is not-found (404)', () => {
    expect(
      resolveApplyGate({
        hasAccessToken: true,
        remoteConfigured: true,
        numericProgramId: 1,
        status: 'not-found',
      })
    ).toBe('not-found')
  })

  it('returns config-error when detail status is error (5xx)', () => {
    expect(
      resolveApplyGate({
        hasAccessToken: true,
        remoteConfigured: true,
        numericProgramId: 1,
        status: 'error',
      })
    ).toBe('config-error')
  })

  it('returns ready when remote is configured and detail is ready', () => {
    expect(
      resolveApplyGate({
        hasAccessToken: true,
        remoteConfigured: true,
        numericProgramId: 1,
        status: 'ready',
      })
    ).toBe('ready')
  })
})
