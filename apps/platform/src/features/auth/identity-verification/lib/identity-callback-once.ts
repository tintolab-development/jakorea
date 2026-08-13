/**
 * React StrictMode에서 identity callback useEffect가 두 번 실행될 때
 * postMessage·state 소비 중복을 막기 위한 모듈 스코프 dedupe.
 */
const handledIdentityCallbacks = new Set<string>()

export function buildIdentityCallbackKey(flow: string, search: string): string {
  return `${flow}:${search || '(empty)'}`
}

export function isIdentityCallbackHandled(key: string): boolean {
  return handledIdentityCallbacks.has(key)
}

export function markIdentityCallbackHandled(key: string): void {
  handledIdentityCallbacks.add(key)
}
