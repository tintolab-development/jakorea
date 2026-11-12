/**
 * 이메일 찾기 → 완료 화면 전달용 메모리 보관.
 * 찾은 이메일은 원문이라 `location.state`(history.state)·storage·Query 캐시에 두지 않는다.
 * 완료 화면이 마운트될 때 읽어 화면 상태로 옮기고 바로 비운다. 새로고침하면 남지 않는다.
 */
let pendingFoundEmail: string | null = null

export function stashFoundEmail(email: string): void {
  const trimmed = email.trim()
  pendingFoundEmail = trimmed || null
}

export function peekFoundEmail(): string | null {
  return pendingFoundEmail
}

export function clearFoundEmail(): void {
  pendingFoundEmail = null
}
