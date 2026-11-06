import { SESSION_REEXPOSE_INTERVAL_MS } from './constants.js'
import type { SessionWarningKind } from './warning.js'

export type SessionWarningDismissState = {
  kind: SessionWarningKind
  expiresAtMs: number
  dismissedAtMs: number
}

export function createSessionWarningDismissState(): {
  dismiss: (kind: SessionWarningKind, expiresAtMs: number, nowMs: number) => void
  resetIfExpiryChanged: (kind: SessionWarningKind | null, expiresAtMs: number | null) => void
  shouldShow: (
    kind: SessionWarningKind | null,
    expiresAtMs: number | null,
    nowMs: number
  ) => boolean
  clear: () => void
} {
  let dismissed: SessionWarningDismissState | null = null

  return {
    dismiss(kind, expiresAtMs, nowMs) {
      dismissed = { kind, expiresAtMs, dismissedAtMs: nowMs }
    },
    resetIfExpiryChanged(kind, expiresAtMs) {
      if (dismissed == null) return
      if (kind == null || expiresAtMs == null || dismissed.kind !== kind || dismissed.expiresAtMs !== expiresAtMs) {
        dismissed = null
      }
    },
    shouldShow(kind, expiresAtMs, nowMs) {
      if (kind == null || expiresAtMs == null) return false
      if (dismissed == null) return true
      if (dismissed.kind !== kind || dismissed.expiresAtMs !== expiresAtMs) return true
      return nowMs - dismissed.dismissedAtMs >= SESSION_REEXPOSE_INTERVAL_MS
    },
    clear() {
      dismissed = null
    },
  }
}
