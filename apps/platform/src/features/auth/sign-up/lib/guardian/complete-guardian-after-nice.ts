import type {
  GuardianConsentResponse,
  GuardianFinalConsentChallengeResponse,
  GuardianSignupStatusResponse,
} from '../../api/guardian-signup-bridge/types.ts'
import {
  isGuardianBridgeConflict,
  isGuardianFinalConsentChallengeInvalid,
  resolveGuardianBridgeError,
  type GuardianBridgeErrorAction,
} from './guardian-bridge-errors.ts'
import { classifyGuardianSignupStatus } from './guardian-bridge-status.ts'

export type GuardianFinalConsentChallengeState = {
  token: string
  idempotencyKey: string
  expiresAt?: string
}

export type CompleteGuardianAfterNiceClient = {
  getStatus: () => Promise<GuardianSignupStatusResponse | null>
  issueFinalConsentChallenge: () => Promise<GuardianFinalConsentChallengeResponse>
  postFinalConsent: (input: {
    finalConsentToken: string
    idempotencyKey: string
  }) => Promise<GuardianConsentResponse>
  readStoredChallenge?: () => GuardianFinalConsentChallengeState | null
  persistChallenge?: (input: GuardianFinalConsentChallengeState) => void
  createIdempotencyKey: () => string
}

export type CompleteGuardianAfterNiceInput = {
  termsVersion: string
  guardianRelation: string
  client: CompleteGuardianAfterNiceClient
  nowMs?: number
}

export type CompleteGuardianAfterNiceResult =
  | { kind: 'completed' }
  | { kind: 'error'; message: string; action: GuardianBridgeErrorAction }

function createChallengeNonceLikeKey() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `guardian-final-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

async function issueChallenge(
  client: CompleteGuardianAfterNiceClient,
): Promise<GuardianFinalConsentChallengeState | { kind: 'error'; message: string; action: GuardianBridgeErrorAction }> {
  try {
    const issued = await client.issueFinalConsentChallenge()
    const token = issued.challengeToken?.trim()
    if (!token) {
      return {
        kind: 'error',
        message: '최종 동의 인증값이 없습니다. 다시 시도해 주세요.',
        action: 'show_message',
      }
    }
    const stored: GuardianFinalConsentChallengeState = {
      token,
      idempotencyKey: client.createIdempotencyKey() || createChallengeNonceLikeKey(),
      expiresAt: issued.expiresAt,
    }
    client.persistChallenge?.(stored)
    return stored
  } catch (error) {
    const resolved = resolveGuardianBridgeError(error)
    return { kind: 'error', message: resolved.message, action: resolved.action }
  }
}

export async function completeGuardianAfterNice(
  input: CompleteGuardianAfterNiceInput,
): Promise<CompleteGuardianAfterNiceResult> {
  const nowMs = input.nowMs ?? Date.now()
  const { client } = input

  if (!input.termsVersion.trim() || !input.guardianRelation.trim()) {
    return {
      kind: 'error',
      message: '동의 약관 정보를 확인할 수 없습니다.',
      action: 'show_message',
    }
  }

  let status: GuardianSignupStatusResponse | null
  try {
    status = await client.getStatus()
  } catch (error) {
    const resolved = resolveGuardianBridgeError(error)
    return { kind: 'error', message: resolved.message, action: resolved.action }
  }

  let kind = classifyGuardianSignupStatus(status, nowMs)
  if (kind === 'consented') {
    return { kind: 'completed' }
  }
  if (kind === 'expired') {
    return {
      kind: 'error',
      message: '보호자 인증이 만료되었습니다. 처음부터 다시 진행해 주세요.',
      action: 'restart_intent',
    }
  }
  if (kind !== 'needs_final_consent') {
    return {
      kind: 'error',
      message: '본인인증이 완료되지 않았습니다. 다시 시도해 주세요.',
      action: 'show_message',
    }
  }

  let challenge = client.readStoredChallenge?.() ?? null
  if (!challenge) {
    const issued = await issueChallenge(client)
    if ('kind' in issued) return issued
    challenge = issued
  }

  try {
    const response = await client.postFinalConsent({
      finalConsentToken: challenge.token,
      idempotencyKey: challenge.idempotencyKey,
    })
    if (classifyGuardianSignupStatus(response, nowMs) === 'consented') {
      return { kind: 'completed' }
    }
  } catch (error) {
    if (
      !isGuardianBridgeConflict(error) &&
      !isGuardianFinalConsentChallengeInvalid(error)
    ) {
      const resolved = resolveGuardianBridgeError(error)
      return { kind: 'error', message: resolved.message, action: resolved.action }
    }
  }

  try {
    status = await client.getStatus()
  } catch (error) {
    const resolved = resolveGuardianBridgeError(error)
    return { kind: 'error', message: resolved.message, action: resolved.action }
  }

  kind = classifyGuardianSignupStatus(status, nowMs)
  if (kind === 'consented') {
    return { kind: 'completed' }
  }

  if (kind === 'needs_final_consent') {
    const issued = await issueChallenge(client)
    if ('kind' in issued) return issued
    try {
      const retry = await client.postFinalConsent({
        finalConsentToken: issued.token,
        idempotencyKey: issued.idempotencyKey,
      })
      if (classifyGuardianSignupStatus(retry, nowMs) === 'consented') {
        return { kind: 'completed' }
      }
    } catch (error) {
      if (isGuardianBridgeConflict(error)) {
        const afterConflict = await client.getStatus().catch(() => null)
        if (classifyGuardianSignupStatus(afterConflict, nowMs) === 'consented') {
          return { kind: 'completed' }
        }
      }
      const resolved = resolveGuardianBridgeError(error)
      return { kind: 'error', message: resolved.message, action: resolved.action }
    }
  }

  return {
    kind: 'error',
    message: '보호자 동의가 완료되지 않았습니다. 다시 시도해 주세요.',
    action: 'show_message',
  }
}

export function resolveGuardianNiceStartAfterConflict(input: {
  status: GuardianSignupStatusResponse | null
  identitySessionId?: number
  nowMs?: number
}): { kind: 'skip_to_success'; identitySessionId: number } | { kind: 'error'; message: string } {
  const classified = classifyGuardianSignupStatus(input.status, input.nowMs)
  if (classified === 'consented' || classified === 'needs_final_consent') {
    return {
      kind: 'skip_to_success',
      identitySessionId: input.identitySessionId && input.identitySessionId > 0 ? input.identitySessionId : 1,
    }
  }
  return {
    kind: 'error',
    message: '보호자 본인인증을 다시 시작할 수 없습니다. 잠시 후 다시 시도해 주세요.',
  }
}
