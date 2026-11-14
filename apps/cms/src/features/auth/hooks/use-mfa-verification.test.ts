import { describe, expect, it } from 'vitest'

import { parseMfaFailedAttemptDetails } from '@/features/auth/lib/admin-mfa-contract'
import {
  applyServerMfaFailure,
  serverMfaAttemptStateFromMfaState,
} from './use-mfa-verification'

const NOW = Date.parse('2026-11-14T00:00:00Z')

describe('serverMfaAttemptStateFromMfaState', () => {
  it('새로고침·재로그인 뒤 challenge 응답의 서버 누적 실패 횟수로 표시를 시작한다', () => {
    const state = serverMfaAttemptStateFromMfaState({
      challengeUuid: 'challenge-after-relogin',
      failedAttempts: 3,
      maxFailedAttempts: 5,
    })
    expect(state.failedAttempts).toBe(3)
    expect(state.maxFailedAttempts).toBe(5)
    expect(state.isLocked).toBe(false)
  })

  it('서버 최대치를 쓰고, 없으면 기본 정책값을 쓴다', () => {
    expect(
      serverMfaAttemptStateFromMfaState({ challengeUuid: 'c', failedAttempts: 1, maxFailedAttempts: 3 })
        .maxFailedAttempts
    ).toBe(3)
    expect(
      serverMfaAttemptStateFromMfaState({ challengeUuid: 'c', failedAttempts: 0 }).maxFailedAttempts
    ).toBe(5)
  })
})

describe('applyServerMfaFailure', () => {
  const initial = serverMfaAttemptStateFromMfaState({
    challengeUuid: 'challenge-1',
    failedAttempts: 1,
    maxFailedAttempts: 5,
  })

  it('실패 응답 details 값으로 표시를 갱신한다(FE 자체 증가 없음)', () => {
    const next = applyServerMfaFailure(
      initial,
      parseMfaFailedAttemptDetails({ failedAttemptCount: '4', maxFailedAttempts: '5' }),
      NOW
    )
    expect(next.failedAttempts).toBe(4)
    expect(next.isLocked).toBe(false)
  })

  it('details를 숫자로 읽지 못하면 표시를 바꾸지 않는다', () => {
    const next = applyServerMfaFailure(
      initial,
      parseMfaFailedAttemptDetails({ failedAttemptCount: 'x', maxFailedAttempts: 'y' }),
      NOW
    )
    expect(next.failedAttempts).toBe(1)
    expect(next.maxFailedAttempts).toBe(5)
  })

  it('서버 값이 최대치에 닿으면 잠금으로 표시한다', () => {
    const next = applyServerMfaFailure(initial, { failedAttemptCount: 5, maxFailedAttempts: 5 }, NOW)
    expect(next.failedAttempts).toBe(5)
    expect(next.isLocked).toBe(true)
    expect(next.lockUntil).not.toBeNull()
  })

  it('재로그인으로 새 challenge가 오면 그 challenge의 서버 누적값을 이어서 쓴다', () => {
    const afterFailures = applyServerMfaFailure(initial, { failedAttemptCount: 2 }, NOW)
    expect(afterFailures.failedAttempts).toBe(2)
    const afterRelogin = serverMfaAttemptStateFromMfaState({
      challengeUuid: 'challenge-2',
      failedAttempts: 2,
      maxFailedAttempts: 5,
    })
    expect(afterRelogin.challengeUuid).toBe('challenge-2')
    expect(afterRelogin.failedAttempts).toBe(2)
  })
})
