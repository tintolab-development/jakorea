import { useCallback, useEffect, useState } from 'react'
import type { User } from '@/types/user'

type MemberUser = Omit<User, 'password'>

/** 원문 일시 상태의 소유자 식별자. 다른 회원(또는 같은 uuid의 다른 역할)이면 원문을 쓰지 않는다. */
export function memberRevealIdentity(
  user: Pick<MemberUser, 'id' | 'memberId' | 'role'> | null | undefined
): string | null {
  return user != null ? `${user.id}:${user.memberId ?? ''}:${user.role}` : null
}

/**
 * 회원 상세 원문(unmask) 응답을 **이 상세 화면 안의 일시 상태**로만 보관한다.
 *
 * - 상위(drawer·목록) 상태, 공용 회원 목록·상세 React Query 캐시에는 쓰지 않는다.
 * - 현재 표시 회원과 소유자가 다르면 원문을 돌려주지 않는다(교차 노출 방지).
 * - 비우면 화면은 이미 받은 마스킹 GET 값으로 즉시 돌아간다. 마스킹 재조회가 늦거나 실패해도
 *   원문이 다시 나올 경로가 없다.
 */
export function useRevealedMemberOverlay(displayUser: MemberUser | null | undefined) {
  const identity = memberRevealIdentity(displayUser)
  const [overlay, setOverlay] = useState<{ identity: string; user: MemberUser } | null>(null)

  useEffect(() => {
    setOverlay(prev => (prev && prev.identity !== identity ? null : prev))
  }, [identity])

  /**
   * owner: 원문을 요청한 시점의 회원. onlyIfCurrent=true(비동기 보강 등)는 이미 비워졌거나
   * 다른 회원으로 바뀐 뒤 도착한 원문을 버린다.
   */
  const holdRevealedUser = useCallback(
    (
      owner: Pick<MemberUser, 'id' | 'memberId' | 'role'>,
      user: MemberUser,
      onlyIfCurrent = false
    ) => {
      const ownerIdentity = memberRevealIdentity(owner)
      if (ownerIdentity == null) return
      setOverlay(prev =>
        onlyIfCurrent && prev?.identity !== ownerIdentity
          ? prev
          : { identity: ownerIdentity, user }
      )
    },
    []
  )

  const clearRevealedUser = useCallback(() => setOverlay(null), [])

  const revealedUser = overlay != null && overlay.identity === identity ? overlay.user : null

  return { revealedUser, holdRevealedUser, clearRevealedUser }
}
