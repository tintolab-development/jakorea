import { beforeEach, describe, expect, it, vi } from 'vitest'

const patchUserBasicInfo = vi.fn()

vi.mock('@/entities/user/api/user-service', async importOriginal => ({
  ...(await importOriginal<typeof import('@/entities/user/api/user-service')>()),
  patchUserBasicInfo: (...args: unknown[]) => patchUserBasicInfo(...args),
}))
vi.mock('@/features/user/api/member-remote-capabilities', async importOriginal => ({
  ...(await importOriginal<typeof import('@/features/user/api/member-remote-capabilities')>()),
  isMembersRemoteEnabled: () => true,
}))

import type { User } from '@/types/user'
import { queryClient } from '@/shared/lib/query-client'
import { memberDetailQueryKey } from '@/features/user/api/hooks/use-member-detail-query'
import { useUserStore } from './user-store'

type MemberUser = Omit<User, 'password'>
const masked = {
  id: 'qa-roster-45',
  memberId: 190045,
  role: 'INDIVIDUAL',
  name: '민서아',
  phone: '010-****-9470',
  email: 'qa.individual.min.se***@tinto.co.kr',
} as unknown as MemberUser
/** 저장 응답 + 관리자 입력 원문이 덧씌워진 결과(mergeUserFromApiResponse) */
const savedRaw = { ...masked, phone: '010-5555-1234', email: 'new.contact@tinto.co.kr' } as MemberUser
const hint = { role: masked.role, memberId: masked.memberId }

describe('회원 저장 후 공용 상세 캐시·스토어 원문 차단 (Step 5 P1 detailResource)', () => {
  beforeEach(() => {
    queryClient.clear()
    useUserStore.setState({ usersById: { [masked.id]: masked } })
    patchUserBasicInfo.mockReset()
  })

  it('개인정보 패치 저장 결과(원문)는 detailResource·usersById에 쓰지 않고 stale 표시만 한다', async () => {
    const key = memberDetailQueryKey(masked.id, hint)
    queryClient.setQueryData(key, masked)
    patchUserBasicInfo.mockResolvedValue(savedRaw)

    const returned = await useUserStore
      .getState()
      .patchUserBasicInfo(masked.id, { phone: '010-5555-1234', email: 'new.contact@tinto.co.kr' })

    expect(returned).toBe(savedRaw) // 호출부(컨트롤러)는 마스킹 GET으로 다시 표시값을 만든다
    expect(queryClient.getQueryData(key)).toBe(masked)
    expect(queryClient.getQueryState(key)?.isInvalidated).toBe(true)
    expect(useUserStore.getState().usersById[masked.id]).toBe(masked)
    const all = JSON.stringify(queryClient.getQueryCache().getAll().map(q => q.state.data))
    expect(all).not.toContain('010-5555-1234')
  })

  it('개인정보가 없는 패치(관리자 권한 유형 등)는 기존처럼 캐시를 갱신한다', async () => {
    const key = memberDetailQueryKey(masked.id, hint)
    const updated = { ...masked, listMetrics: { adminPermissionVariant: 'viewer' } } as MemberUser
    patchUserBasicInfo.mockResolvedValue(updated)
    await useUserStore
      .getState()
      .patchUserBasicInfo(masked.id, { listMetrics: { adminPermissionVariant: 'viewer' } })
    expect(queryClient.getQueryData(key)).toBe(updated)
    expect(useUserStore.getState().usersById[masked.id]).toBe(updated)
  })
})
