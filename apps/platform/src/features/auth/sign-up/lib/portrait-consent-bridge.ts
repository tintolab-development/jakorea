import type {
  AgreementState,
  GuardianAgreementState,
} from '../model/sign-up.types'
import { SIGN_UP_PATH } from './wizard-location'

export const SIGN_UP_PORTRAIT_CONSENT_PATH = '/auth/sign-up/portrait-consent'

const BRIDGE_STORAGE_KEY = 'platform:sign-up-portrait-consent-bridge'
const DRAFT_STORAGE_KEY = 'platform:sign-up-portrait-consent-draft'

export type PortraitConsentBridgeSource = 'adult' | 'guardian'

export type PortraitConsentBridgeState = {
  source: PortraitConsentBridgeSource
  /** e.g. `?step=3&phase=agreement` */
  returnSearch: string
  agreements?: AgreementState
  guardianAgreements?: GuardianAgreementState
  verifiedName?: string
  portraitCompleted?: boolean
}

/** Strict Mode remount에서도 동일 스냅샷을 재적용하기 위한 메모리 핸드오프 */
let pendingRestore: PortraitConsentBridgeState | null = null

export type PortraitConsentDraftState = {
  draft: unknown
  signatures?: {
    final?: unknown
  }
}

function canUseSessionStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined'
}

function isAgreementState(value: unknown): value is AgreementState {
  if (!value || typeof value !== 'object') return false
  const o = value as Record<string, unknown>
  return (
    typeof o.service === 'boolean' &&
    typeof o.privacy === 'boolean' &&
    typeof o.portrait === 'boolean'
  )
}

function isBridgeState(value: unknown): value is PortraitConsentBridgeState {
  if (!value || typeof value !== 'object') return false
  const o = value as Record<string, unknown>
  if (o.source !== 'adult' && o.source !== 'guardian') return false
  if (typeof o.returnSearch !== 'string') return false
  if (o.agreements != null && !isAgreementState(o.agreements)) return false
  if (o.guardianAgreements != null && !isAgreementState(o.guardianAgreements)) return false
  if (o.verifiedName != null && typeof o.verifiedName !== 'string') return false
  if (o.portraitCompleted != null && typeof o.portraitCompleted !== 'boolean') return false
  return true
}

export function savePortraitConsentBridge(state: PortraitConsentBridgeState): void {
  pendingRestore = null
  if (!canUseSessionStorage()) return
  try {
    window.sessionStorage.setItem(BRIDGE_STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* quota / private mode */
  }
}

export function peekPortraitConsentBridge(): PortraitConsentBridgeState | null {
  if (!canUseSessionStorage()) return null
  try {
    const raw = window.sessionStorage.getItem(BRIDGE_STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!isBridgeState(parsed)) {
      window.sessionStorage.removeItem(BRIDGE_STORAGE_KEY)
      return null
    }
    return parsed
  } catch {
    window.sessionStorage.removeItem(BRIDGE_STORAGE_KEY)
    return null
  }
}

/** 작성 완료 플래그만 갱신 (스냅샷 유지) */
export function markPortraitConsentCompleted(): void {
  const current = peekPortraitConsentBridge()
  if (current == null) return
  savePortraitConsentBridge({ ...current, portraitCompleted: true })
}

/**
 * 가입 약관 스텝 복귀 시 스냅샷 적용.
 * sessionStorage는 1회 비우되, 모듈 메모리에 남겨 Strict Mode remount에서도 재적용 가능.
 */
export function consumePortraitConsentBridge(): PortraitConsentBridgeState | null {
  if (pendingRestore != null) return pendingRestore

  const current = peekPortraitConsentBridge()
  if (current == null) return null

  pendingRestore = current
  if (canUseSessionStorage()) {
    try {
      window.sessionStorage.removeItem(BRIDGE_STORAGE_KEY)
    } catch {
      /* ignore */
    }
  }
  return pendingRestore
}

export function clearPortraitConsentBridge(): void {
  pendingRestore = null
  if (!canUseSessionStorage()) return
  try {
    window.sessionStorage.removeItem(BRIDGE_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

/** 약관 스텝을 지나갈 때 메모리 핸드오프 해제 */
export function dismissPortraitConsentRestore(): void {
  pendingRestore = null
}

export function loadPortraitConsentDraftState<T extends PortraitConsentDraftState>(
  fallback: T
): T {
  if (!canUseSessionStorage()) return fallback
  try {
    const raw = window.sessionStorage.getItem(DRAFT_STORAGE_KEY)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as T
    if (parsed?.draft == null || typeof parsed.draft !== 'object') return fallback
    return {
      ...fallback,
      ...parsed,
      draft: parsed.draft,
      signatures: { ...fallback.signatures, ...parsed.signatures },
    }
  } catch {
    return fallback
  }
}

export function savePortraitConsentDraftState(state: PortraitConsentDraftState): void {
  if (!canUseSessionStorage()) return
  try {
    window.sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* quota / private mode */
  }
}

export function buildPortraitConsentReturnPath(returnSearch: string): string {
  const search = returnSearch.startsWith('?') ? returnSearch : `?${returnSearch}`
  return `${SIGN_UP_PATH}${search}`
}

export function buildPortraitConsentPath(returnSearch: string): string {
  const params = new URLSearchParams()
  params.set('returnTo', `${SIGN_UP_PATH}${returnSearch.startsWith('?') ? returnSearch : `?${returnSearch}`}`)
  return `${SIGN_UP_PORTRAIT_CONSENT_PATH}?${params.toString()}`
}
