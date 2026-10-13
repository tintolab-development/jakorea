const DRAFT_STORAGE_KEY = 'platform:mypage-settings-portrait-consent-draft'
const DRAFT_SCOPE_KEY = 'platform:mypage-settings-portrait-consent-draft-scope'
export const MYPAGE_PORTRAIT_CONSENT_DRAFT_SCOPE = 'mypage-settings-portrait'

export type MypagePortraitConsentDraftState = {
  draft: unknown
  signatures?: {
    final?: unknown
  }
}

function canUseSessionStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined'
}

export function loadMypagePortraitConsentDraftState<T extends MypagePortraitConsentDraftState>(
  fallback: T,
): T {
  if (!canUseSessionStorage()) return fallback
  try {
    const storedScope = window.sessionStorage.getItem(DRAFT_SCOPE_KEY)
    if (storedScope !== MYPAGE_PORTRAIT_CONSENT_DRAFT_SCOPE) {
      window.sessionStorage.removeItem(DRAFT_STORAGE_KEY)
      window.sessionStorage.removeItem(DRAFT_SCOPE_KEY)
      return fallback
    }
    const raw = window.sessionStorage.getItem(DRAFT_STORAGE_KEY)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as T
    if (parsed?.draft == null || typeof parsed.draft !== 'object') return fallback
    const paragraphs = (parsed.draft as { paragraphs?: unknown }).paragraphs
    if (!Array.isArray(paragraphs) || paragraphs.length === 0) return fallback
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

export function saveMypagePortraitConsentDraftState(state: MypagePortraitConsentDraftState): void {
  if (!canUseSessionStorage()) return
  try {
    window.sessionStorage.setItem(DRAFT_SCOPE_KEY, MYPAGE_PORTRAIT_CONSENT_DRAFT_SCOPE)
    window.sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* quota / private mode */
  }
}

export function clearMypagePortraitConsentDraftState(): void {
  if (!canUseSessionStorage()) return
  try {
    window.sessionStorage.removeItem(DRAFT_STORAGE_KEY)
    window.sessionStorage.removeItem(DRAFT_SCOPE_KEY)
  } catch {
    /* ignore */
  }
}
