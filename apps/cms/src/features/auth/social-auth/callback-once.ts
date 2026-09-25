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

const inflightByKey = new Map<string, Promise<unknown>>()

/**
 * StrictMode remount가 one-time adminSsoSessionId를 두 번 소비하지 않도록
 * 같은 키의 요청은 하나의 Promise를 공유한다.
 */
export function runOAuthCallbackOnce<T>(key: string, run: () => Promise<T>): Promise<T> {
  const existing = inflightByKey.get(key)
  if (existing) {
    return existing as Promise<T>
  }
  const promise = run()
  inflightByKey.set(key, promise)
  promise.catch(() => {
    if (inflightByKey.get(key) === promise) {
      inflightByKey.delete(key)
    }
  })
  return promise
}
