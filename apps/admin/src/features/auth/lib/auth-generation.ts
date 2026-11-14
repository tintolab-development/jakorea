/**
 * 로그인 세대 번호. 로그아웃·새 로그인 적용 때마다 올린다.
 * 진행 중이던 refresh 응답이 그 사이 로그아웃·다른 로그인 뒤에 도착하면 저장하지 않도록 비교한다
 * (Platform `shared/lib/auth-token.ts`의 authGeneration과 같은 방식). 순환 import를 피하려고 의존성 없이 둔다.
 */
let authGeneration = 0

export function getAuthGeneration(): number {
  return authGeneration
}

export function bumpAuthGeneration(): void {
  authGeneration += 1
}

/** refresh 도중 로그아웃·다른 로그인으로 세션이 바뀌어 응답을 버렸다 — 로그아웃 근거가 아니다 */
export class SessionChangedDuringRefreshError extends Error {
  constructor() {
    super('Session changed during refresh')
    this.name = 'SessionChangedDuringRefreshError'
  }
}
