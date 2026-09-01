/**
 * React StrictMode에서 callback useEffect가 두 번 실행될 때
 * OAuth state 소비·navigate 중복을 막기 위한 모듈 스코프 dedupe.
 */
const handledOAuthLinkCallbacks = new Set<string>()

export function buildOAuthLinkCallbackKey(
  provider: string,
  code: string | null,
  state: string | null
): string {
  return `${provider}:${code ?? ''}:${state ?? ''}`
}

/** 이미 처리된 mock link callback이면 true */
export function isOAuthLinkCallbackHandled(key: string): boolean {
  return handledOAuthLinkCallbacks.has(key)
}

export function markOAuthLinkCallbackHandled(key: string): void {
  handledOAuthLinkCallbacks.add(key)
}

const handledSignupCallbacks = new Set<string>()

export function buildSignupCallbackKey(search: string): string {
  return search || '(empty)'
}

export function isSignupCallbackHandled(key: string): boolean {
  return handledSignupCallbacks.has(key)
}

export function markSignupCallbackHandled(key: string): void {
  handledSignupCallbacks.add(key)
}
