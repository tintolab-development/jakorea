/** @vitest-environment jsdom */
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { User } from '@/types/user'
import { useRevealedMemberOverlay } from './use-revealed-member-overlay'

type MemberUser = Omit<User, 'password'>

function member(id: string, memberId: number, phone: string, email: string): MemberUser {
  return { id, memberId, role: 'INDIVIDUAL', name: '김회원', phone, email } as unknown as MemberUser
}

const maskedA = member('u-190045', 190045, '010-****-5678', 'ab***@example.test')
const rawA = member('u-190045', 190045, '010-1234-5678', 'abcde@example.test')
const maskedB = member('u-190081', 190081, '010-****-1111', 'zz***@example.test')

describe('회원 상세 원문 일시 상태 (P1 수정 취소·목록 잔류)', () => {
  it('원문은 같은 회원 상세에서만 보이고, 비우면 즉시 마스킹 GET 값으로 돌아간다', () => {
    const { result } = renderHook(({ user }) => useRevealedMemberOverlay(user), {
      initialProps: { user: maskedA },
    })
    act(() => result.current.holdRevealedUser(maskedA, rawA))
    expect(result.current.revealedUser?.phone).toBe('010-1234-5678')

    act(() => result.current.clearRevealedUser())
    expect(result.current.revealedUser).toBeNull()
  })

  it('다른 회원으로 바뀌면 같은 렌더에서 이전 원문을 노출하지 않는다', () => {
    const { result, rerender } = renderHook(({ user }) => useRevealedMemberOverlay(user), {
      initialProps: { user: maskedA },
    })
    act(() => result.current.holdRevealedUser(maskedA, rawA))
    rerender({ user: maskedB })
    expect(result.current.revealedUser).toBeNull()
  })

  it('회원 전환 시 열람 해제(onRemask)로 비우면 되돌아와도 재사용하지 않는다', () => {
    const { result, rerender } = renderHook(({ user }) => useRevealedMemberOverlay(user), {
      initialProps: { user: maskedA },
    })
    act(() => result.current.holdRevealedUser(maskedA, rawA))
    rerender({ user: maskedB })
    // usePersonalInfoReveal resetDeps → onRemask(clearRevealedUser) 동기 호출과 같다
    act(() => result.current.clearRevealedUser())
    rerender({ user: maskedA })
    expect(result.current.revealedUser).toBeNull()
  })

  it('비운 뒤 늦게 도착한 원문 보강(onlyIfCurrent)은 버린다 — 지연 응답 원문 재노출 없음', () => {
    const { result } = renderHook(({ user }) => useRevealedMemberOverlay(user), {
      initialProps: { user: maskedA },
    })
    act(() => result.current.holdRevealedUser(maskedA, rawA))
    act(() => result.current.clearRevealedUser())
    act(() => result.current.holdRevealedUser(maskedA, rawA, true))
    expect(result.current.revealedUser).toBeNull()
  })

  it('다른 회원 소유 원문은 현재 상세에 쓰이지 않는다(교차 노출 없음)', () => {
    const { result } = renderHook(({ user }) => useRevealedMemberOverlay(user), {
      initialProps: { user: maskedB },
    })
    act(() => result.current.holdRevealedUser(maskedA, rawA))
    expect(result.current.revealedUser).toBeNull()
  })

  it('상위에서 받은 마스킹 사용자 객체는 변경하지 않는다(목록·drawer 원문 오염 없음)', () => {
    const before = JSON.stringify(maskedA)
    const { result } = renderHook(() => useRevealedMemberOverlay(maskedA))
    act(() => result.current.holdRevealedUser(maskedA, rawA))
    expect(JSON.stringify(maskedA)).toBe(before)
  })
})
