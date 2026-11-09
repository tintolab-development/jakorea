import { QueryClient, type InfiniteData } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'
import type { User } from '@/types/user'
import { mergeListUserWithFetchedDetail } from '@/features/user/api/merge-list-user-with-detail'
import { resolveMemberDisplayAfterSave } from './member-save-display'

type MemberUser = Omit<User, 'password'>

function member(phone: string, email: string): MemberUser {
  return {
    id: 'u-190045',
    memberId: 190045,
    role: 'INDIVIDUAL',
    name: '민서아',
    phone,
    email,
  } as unknown as MemberUser
}

const before = member('010-****-9470', 'qa.individual.min.se***@tinto.co.kr')
/** 저장 응답 + 관리자 입력 원문이 덧씌워진 객체(applySavedBasicInfoPatchToUser 결과) */
const savedWithRaw = member('010-5555-1234', 'new.contact@tinto.co.kr')
/** 저장 후 마스킹 상세 GET */
const maskedAfterSave = member('010-****-1234', 'new.c***@tinto.co.kr')

const isRaw = (v: unknown) =>
  typeof v === 'string' && !v.includes('*') && (/\d{3}-\d{3,4}-\d{4}/.test(v) || v.includes('@'))

describe('회원 정보 저장 후 표시·목록 데이터 (P1 저장 후 목록 원문)', () => {
  it('원격 profile 저장은 입력 원문 대신 마스킹 상세 GET 결과를 넘긴다', async () => {
    const fetchMaskedDetail = vi.fn().mockResolvedValue(maskedAfterSave)
    const result = await resolveMemberDisplayAfterSave({
      saved: savedWithRaw,
      before,
      scope: 'profile',
      membersRemote: true,
      fetchMaskedDetail,
    })
    expect(fetchMaskedDetail).toHaveBeenCalledWith(before)
    expect(result).toEqual({ user: maskedAfterSave, refetchNeeded: false })
    expect(isRaw(result.user.phone)).toBe(false)
    expect(isRaw(result.user.email)).toBe(false)
  })

  it('마스킹 재조회가 실패해도 원문을 넘기지 않고 재조회를 요청한다', async () => {
    const result = await resolveMemberDisplayAfterSave({
      saved: savedWithRaw,
      before,
      scope: 'profile',
      membersRemote: true,
      fetchMaskedDetail: () => Promise.reject(new Error('network')),
    })
    expect(result).toEqual({ user: before, refetchNeeded: true })
  })

  it('개인정보를 다루지 않는 저장 범위는 추가 조회 없이 그대로 넘긴다', async () => {
    const fetchMaskedDetail = vi.fn()
    for (const scope of ['comment', 'instructor_fee_ja'] as const) {
      const result = await resolveMemberDisplayAfterSave({
        saved: before,
        before,
        scope,
        membersRemote: true,
        fetchMaskedDetail,
      })
      expect(result.user).toBe(before)
    }
    expect(fetchMaskedDetail).not.toHaveBeenCalled()
  })

  it('공용 목록 캐시 행 갱신에 원문이 들어가지 않는다(목록 페이지 patchListCache와 같은 병합)', async () => {
    const client = new QueryClient()
    const listKey = ['members', 'list', { kind: 'all' }]
    client.setQueryData<InfiniteData<{ users: MemberUser[] }>>(listKey, {
      pages: [{ users: [before, member('010-****-1111', 'other***@x.kr')] }],
      pageParams: [0],
    })
    const { user } = await resolveMemberDisplayAfterSave({
      saved: savedWithRaw,
      before,
      scope: 'profile',
      membersRemote: true,
      fetchMaskedDetail: () => Promise.resolve(maskedAfterSave),
    })
    client.setQueryData<InfiniteData<{ users: MemberUser[] }>>(listKey, old =>
      old
        ? {
            ...old,
            pages: old.pages.map(page => ({
              users: page.users.map(u =>
                u.memberId === user.memberId ? mergeListUserWithFetchedDetail(u, user) : u
              ),
            })),
          }
        : old
    )
    const rows = client.getQueryData<InfiniteData<{ users: MemberUser[] }>>(listKey)!.pages[0].users
    expect(rows.some(r => isRaw(r.phone) || isRaw(r.email))).toBe(false)
    expect(rows[0].phone).toBe('010-****-1234')
  })
})
