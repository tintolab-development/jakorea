import assert from 'node:assert/strict'
import { completeGuardianAfterNice } from './complete-guardian-after-nice.ts'
import { shouldSkipGuardianNiceStart } from './guardian-bridge-status.ts'

function bridgeError(code: string, message: string, httpStatus: number) {
  return Object.assign(new Error(message), {
    name: 'GuardianSignupBridgeApiError',
    code,
    httpStatus,
  })
}

const now = Date.parse('2026-10-21T00:00:00.000Z')

{
  let consentPosts = 0
  let challenges = 0
  const result = await completeGuardianAfterNice({
    termsVersion: 'v1',
    guardianRelation: '모',
    nowMs: now,
    client: {
      getStatus: async () => ({ status: 'CONSENTED', identityVerified: true }),
      issueFinalConsentChallenge: async () => {
        challenges += 1
        return { challengeToken: 'tok' }
      },
      postFinalConsent: async () => {
        consentPosts += 1
        return { status: 'CONSENTED' }
      },
      createIdempotencyKey: () => 'final-1',
    },
  })
  assert.equal(result.kind, 'completed')
  assert.equal(challenges, 0)
  assert.equal(consentPosts, 0)
}

{
  const tokens: string[] = []
  const keys: string[] = []
  const result = await completeGuardianAfterNice({
    termsVersion: 'v1',
    guardianRelation: '부',
    nowMs: now,
    client: {
      getStatus: async () => ({ status: 'PENDING', identityVerified: true }),
      issueFinalConsentChallenge: async () => ({
        challengeToken: 'challenge-token-1',
        expiresAt: '2026-10-21T00:05:00.000Z',
      }),
      postFinalConsent: async input => {
        tokens.push(input.finalConsentToken)
        keys.push(input.idempotencyKey)
        return { status: 'CONSENTED' }
      },
      createIdempotencyKey: () => 'final-uuid',
    },
  })
  assert.equal(result.kind, 'completed')
  assert.deepEqual(tokens, ['challenge-token-1'])
  assert.deepEqual(keys, ['final-uuid'])
}

{
  assert.equal(
    shouldSkipGuardianNiceStart({ status: 'PENDING', identityVerified: true }, now),
    true,
  )
}

{
  const result = await completeGuardianAfterNice({
    termsVersion: 'v1',
    guardianRelation: '모',
    nowMs: now,
    client: {
      getStatus: async () => {
        throw bridgeError('CONFLICT', 'already started', 409)
      },
      issueFinalConsentChallenge: async () => ({ challengeToken: 'tok' }),
      postFinalConsent: async () => ({ status: 'PENDING' }),
      createIdempotencyKey: () => 'final-1',
    },
  })
  assert.equal(result.kind, 'error')
  if (result.kind === 'error') {
    assert.equal(result.action, 'refetch_status')
  }
}

{
  const tokens: string[] = []
  let challenges = 0
  const result = await completeGuardianAfterNice({
    termsVersion: 'v1',
    guardianRelation: '모',
    nowMs: now,
    client: {
      getStatus: async () => ({ status: 'PENDING', identityVerified: true }),
      issueFinalConsentChallenge: async () => {
        challenges += 1
        return {
          challengeToken: `challenge-token-${challenges}`,
          expiresAt: '2026-10-21T00:05:00.000Z',
        }
      },
      postFinalConsent: async input => {
        tokens.push(input.finalConsentToken)
        if (input.finalConsentToken === 'stale-token') {
          throw bridgeError(
            'GUARDIAN_FINAL_CONSENT_CHALLENGE_INVALID',
            '요청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
            401,
          )
        }
        return { status: 'CONSENTED' }
      },
      readStoredChallenge: () => ({
        token: 'stale-token',
        idempotencyKey: 'stale-key',
      }),
      createIdempotencyKey: () => 'final-retry',
    },
  })
  assert.equal(result.kind, 'completed')
  assert.deepEqual(tokens, ['stale-token', 'challenge-token-1'])
  assert.equal(challenges, 1)
}

{
  let consentPosts = 0
  let statusCalls = 0
  const result = await completeGuardianAfterNice({
    termsVersion: 'v1',
    guardianRelation: '모',
    nowMs: now,
    client: {
      getStatus: async () => {
        statusCalls += 1
        if (statusCalls === 1) {
          return { status: 'PENDING', identityVerified: true }
        }
        return { status: 'CONSENTED', identityVerified: true }
      },
      issueFinalConsentChallenge: async () => ({ challengeToken: 'challenge-token-2' }),
      postFinalConsent: async () => {
        consentPosts += 1
        throw bridgeError('CONFLICT', 'already consented', 409)
      },
      createIdempotencyKey: () => 'final-conflict',
    },
  })
  assert.equal(result.kind, 'completed')
  assert.equal(consentPosts, 1)
}

// 최종 동의 409 GUARDIAN_RELATION_INVALID — 다시 시도하지 않고 서버 message·코드를 돌려준다
{
  let consentPosts = 0
  let challenges = 0
  const result = await completeGuardianAfterNice({
    termsVersion: 'v1',
    guardianRelation: '이웃',
    nowMs: now,
    client: {
      getStatus: async () => ({ status: 'PENDING', identityVerified: true }),
      issueFinalConsentChallenge: async () => {
        challenges += 1
        return { challengeToken: 'tok' }
      },
      postFinalConsent: async () => {
        consentPosts += 1
        throw bridgeError('GUARDIAN_RELATION_INVALID', '서버 관계 문구', 409)
      },
      createIdempotencyKey: () => 'final-relation',
    },
  })
  assert.deepEqual(result, {
    kind: 'error',
    message: '서버 관계 문구',
    action: 'show_message',
    code: 'GUARDIAN_RELATION_INVALID',
  })
  assert.equal(challenges, 1)
  assert.equal(consentPosts, 1)
}

console.log('complete-guardian-after-nice.selfcheck: ok')
