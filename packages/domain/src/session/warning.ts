import { parseInstantMs } from './clock.js'
import { SESSION_WARNING_LEAD_MS } from './constants.js'
import type { AdminAuthSessionResponse } from './parse.js'

export type SessionWarningKind = 'idle' | 'absolute'

export type SessionWarningView = {
  kind: SessionWarningKind
  expiresAtMs: number
  remainingMs: number
}

export function resolveSessionWarningView(input: {
  session: AdminAuthSessionResponse | null
  nowMs: number
}): SessionWarningView | null {
  const session = input.session
  if (!session) return null
  const absoluteMs = parseInstantMs(session.absoluteExpiresAt)
  if (absoluteMs == null) return null
  const remainingAbsolute = absoluteMs - input.nowMs
  if (remainingAbsolute <= 0) return { kind: 'absolute', expiresAtMs: absoluteMs, remainingMs: 0 }

  const idleMs =
    session.idlePolicyEnforced === true ? parseInstantMs(session.idleExpiresAt) : null
  const remainingIdle = idleMs == null ? null : idleMs - input.nowMs

  const idleImminent =
    remainingIdle != null && remainingIdle >= 0 && remainingIdle <= SESSION_WARNING_LEAD_MS
  const absoluteImminent = remainingAbsolute <= SESSION_WARNING_LEAD_MS

  if (!idleImminent && !absoluteImminent) return null
  if (idleImminent && absoluteImminent) {
    if (remainingIdle! < remainingAbsolute) {
      return { kind: 'idle', expiresAtMs: idleMs!, remainingMs: remainingIdle! }
    }
    return { kind: 'absolute', expiresAtMs: absoluteMs, remainingMs: remainingAbsolute }
  }
  if (absoluteImminent) {
    return { kind: 'absolute', expiresAtMs: absoluteMs, remainingMs: remainingAbsolute }
  }
  return { kind: 'idle', expiresAtMs: idleMs!, remainingMs: remainingIdle! }
}
