import type { WritingFormDraft } from '@jakorea/form-schema/writing-form'
import type {
  AgreementState,
  GuardianAgreementState,
} from '../model/sign-up.types'
import { SIGN_UP_PATH } from './wizard-location'
import { clearSignupMemberVerifiedIdentity } from './signup-verified-identity-storage'
import { clearMinorMemberBirthDate } from './signup-minor-birth-storage'
import { clearSignupWizardFields } from './signup-wizard-field-storage'

export const SIGN_UP_PORTRAIT_CONSENT_PATH = '/auth/sign-up/portrait-consent'

const BRIDGE_STORAGE_KEY = 'platform:sign-up-portrait-consent-bridge'
const DRAFT_STORAGE_KEY = 'platform:sign-up-portrait-consent-draft'
const DRAFT_SCOPE_KEY = 'platform:sign-up-portrait-consent-draft-scope'
const WIZARD_INSTANCE_KEY = 'platform:sign-up-wizard-instance'

function createWizardInstanceId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `signup-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

/** 가입 시도마다 달라지는 ID — 초상권 draft scope 분리 */
export function ensureSignupWizardInstanceId(): string {
  if (!canUseSessionStorage()) return createWizardInstanceId()
  try {
    const existing = window.sessionStorage.getItem(WIZARD_INSTANCE_KEY)?.trim()
    if (existing) return existing
    const next = createWizardInstanceId()
    window.sessionStorage.setItem(WIZARD_INSTANCE_KEY, next)
    return next
  } catch {
    return createWizardInstanceId()
  }
}

/** 가입 초상권 작성 session draft 제거 */
export function clearPortraitConsentDraftStorage(): void {
  if (!canUseSessionStorage()) return
  try {
    window.sessionStorage.removeItem(DRAFT_STORAGE_KEY)
    window.sessionStorage.removeItem(DRAFT_SCOPE_KEY)
  } catch {
    /* ignore */
  }
}

export type PortraitConsentBridgeSource = 'adult' | 'guardian'

export type PortraitConsentBridgeState = {
  source: PortraitConsentBridgeSource
  /** e.g. `?step=3&phase=agreement` */
  returnSearch: string
  agreements?: AgreementState
  guardianAgreements?: GuardianAgreementState
  verifiedName?: string
  portraitCompleted?: boolean
  memberType?: 'GENERAL' | 'TEACHER'
  birthDateIso?: string
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
  if (o.memberType != null && o.memberType !== 'GENERAL' && o.memberType !== 'TEACHER') return false
  if (o.birthDateIso != null && typeof o.birthDateIso !== 'string') return false
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

/** 초상권 bridge + 작성 draft + 메모리 핸드오프 전부 삭제 (가입 새로 시작·완료 시) */
export function clearPortraitConsentSession(): void {
  pendingRestore = null
  clearSignupMemberVerifiedIdentity()
  clearMinorMemberBirthDate()
  clearSignupWizardFields()
  if (!canUseSessionStorage()) return
  try {
    window.sessionStorage.removeItem(BRIDGE_STORAGE_KEY)
    window.sessionStorage.removeItem(WIZARD_INSTANCE_KEY)
    clearPortraitConsentDraftStorage()
  } catch {
    /* ignore */
  }
}

export function portraitConsentDraftScope(bridge: PortraitConsentBridgeState | null): string {
  if (bridge == null) return ''
  return `${ensureSignupWizardInstanceId()}:${bridge.source}:${bridge.returnSearch}`
}

export function loadPortraitConsentDraftState<T extends PortraitConsentDraftState>(
  fallback: T,
  scope: string
): T {
  if (!canUseSessionStorage()) return fallback
  if (scope === '') {
    clearPortraitConsentDraftStorage()
    return fallback
  }
  try {
    const storedScope = window.sessionStorage.getItem(DRAFT_SCOPE_KEY)
    if (storedScope !== scope) {
      window.sessionStorage.removeItem(DRAFT_STORAGE_KEY)
      window.sessionStorage.removeItem(DRAFT_SCOPE_KEY)
      return fallback
    }
    const raw = window.sessionStorage.getItem(DRAFT_STORAGE_KEY)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as T
    if (parsed?.draft == null || typeof parsed.draft !== 'object') return fallback
    const paragraphs = (parsed.draft as { paragraphs?: unknown }).paragraphs
    if (!Array.isArray(paragraphs) || paragraphs.length === 0) {
      window.sessionStorage.removeItem(DRAFT_STORAGE_KEY)
      return fallback
    }
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

export function savePortraitConsentDraftState(
  state: PortraitConsentDraftState,
  scope: string
): void {
  if (!canUseSessionStorage()) return
  if (scope === '') return
  try {
    window.sessionStorage.setItem(DRAFT_SCOPE_KEY, scope)
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

/** 가입 완료 시 sessionStorage에 남은 초상권 작성 draft (현재 wizard instance scope만) */
export function readPortraitConsentDraftForSubmit(): WritingFormDraft | null {
  if (!canUseSessionStorage()) return null

  const scope = window.sessionStorage.getItem(DRAFT_SCOPE_KEY)?.trim()
  if (!scope) return null

  const wizardId = ensureSignupWizardInstanceId()
  if (!scope.startsWith(`${wizardId}:`)) return null

  const loaded = loadPortraitConsentDraftState(
    {
      draft: { schemaVersion: 1, formSettings: { titleNumbering: 'numeric' }, paragraphs: [] },
      signatures: {},
    },
    scope
  )

  const draft = loaded.draft
  if (draft == null || typeof draft !== 'object') return null
  const paragraphs = (draft as WritingFormDraft).paragraphs
  if (!Array.isArray(paragraphs) || paragraphs.length === 0) return null

  return draft as WritingFormDraft
}
