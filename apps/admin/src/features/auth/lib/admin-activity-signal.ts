/**
 * 전역 사용자 입력 Activity가 서버에 기록됐음을 세션 경고 훅에 알린다.
 * 정책 ON이면 훅이 GET Session으로 새 유휴 기한을 다시 읽는다 (Activity 응답만으로 기한을 계산하지 않는다).
 * 「로그인 연장」 버튼의 Activity는 자체적으로 Session을 1회 조회하므로 여기로 알리지 않는다.
 */
type Listener = () => void

const listeners = new Set<Listener>()

export function notifyAdminActivityRecorded(): void {
  for (const listener of [...listeners]) listener()
}

export function subscribeAdminActivityRecorded(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
