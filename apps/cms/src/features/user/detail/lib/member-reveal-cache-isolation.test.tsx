/** @vitest-environment jsdom */
import { act, renderHook } from '@testing-library/react'
import { QueryClient } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const fetchMemberRolePrivacyUnmask = vi.fn()

vi.mock('@/features/user/api/member-privacy-unmask', () => ({
  fetchMemberRolePrivacyUnmask: (...args: unknown[]) => fetchMemberRolePrivacyUnmask(...args),
  fetchAdminAccountPrivacyUnmask: vi.fn(),
  fetchInstructorRoleRequestPrivacyUnmask: vi.fn(),
}))
vi.mock('@/features/user/api/member-remote-capabilities', () => ({ isMembersRemoteEnabled: () => true }))
vi.mock('@/shared/lib/admin-role-policy', () => ({
  guardAdminAction: () => true,
  resolveAdminRoleCodeFromUser: () => 'MASTER',
  showAdminAccessDeniedAlert: vi.fn(),
}))
vi.mock('@/features/user/detail/lib/use-my-program-privacy-role', () => ({
  useMyProgramPrivacyRole: () => ({ pending: false, canRevealGeneral: true, canRevealSensitive: true, refetch: vi.fn() }),
}))
vi.mock('@/features/user/detail/ui/modal/user-personal-info-reveal-confirm-modal', () => ({
  UserPersonalInfoRevealConfirmModal: () => null,
}))
vi.mock('@/shared/ui/cms-alert-modal-api', () => ({ cmsAlertModal: { show: vi.fn() } }))

import type { User } from '@/types/user'
import { memberQueryKeys } from '@/features/user/api/member-query-keys'
import { usePersonalInfoReveal } from './use-personal-info-reveal'
import { useRevealedMemberOverlay } from './use-revealed-member-overlay'

type MemberUser = Omit<User, 'password'>
const RAW_PHONE = '010-1234-5678'
const RAW_EMAIL = 'general@test.com'
const masked = {
  id: '60cc1f17',
  memberId: 190081,
  role: 'INDIVIDUAL',
  name: '일반회원',
  phone: '010-****-9470',
  email: 'gene***@test.com',
} as unknown as MemberUser
const masked2 = { ...masked, id: 'a8f3c2e1', memberId: 190082 } as MemberUser

const detailKey = [...memberQueryKeys.detailResource('member', 190081), 'INDIVIDUAL', ''] as const
const roleRequestKey = memberQueryKeys.instructorRoleRequests.detail(501)

function cacheHasRaw(client: QueryClient) {
  return client
    .getQueryCache()
    .getAll()
    .some(q => JSON.stringify(q.state.data ?? null).includes(RAW_PHONE) || JSON.stringify(q.state.data ?? null).includes(RAW_EMAIL))
}

/** 회원 상세 컨트롤러와 같은 배선: 원문 응답 → onPrivacyUnmasked → 오버레이, 해제 → onRemask */
function useMemberDetailHarness(user: MemberUser) {
  const overlay = useRevealedMemberOverlay(user)
  const reveal = usePersonalInfoReveal({
    resolveAccessItem: () => '회원 상세 정보',
    resolveMemberId: () => String(user.memberId),
    resolveMemberRole: () => user.role,
    onPrivacyUnmasked: payload =>
      overlay.holdRevealedUser(user, { ...user, ...(payload as Partial<MemberUser>) }),
    onRemask: overlay.clearRevealedUser,
    resetDeps: [user.id, user.memberId],
    controlMode: 'hideWhenRevealed',
  })
  return { reveal, revealedUser: reveal.personalInfoRevealed ? overlay.revealedUser : null }
}

describe('회원 수동 열람 — 공용 상세 캐시 원문 차단 (Step 5 P1)', () => {
  let client: QueryClient
  beforeEach(() => {
    client = new QueryClient()
    client.setQueryData(detailKey, masked)
    client.setQueryData(roleRequestKey, { requestId: 501, phone: '010-****-9470' })
    fetchMemberRolePrivacyUnmask.mockReset()
    fetchMemberRolePrivacyUnmask.mockResolvedValue({ phone: RAW_PHONE, email: RAW_EMAIL })
  })

  it('수동 열람 중에도 detailResource·권한 신청 상세 캐시에 원문이 없고, 원문은 오버레이에만 있다', async () => {
    const { result } = renderHook(() => useMemberDetailHarness(masked))
    await act(async () => {
      result.current.reveal.submitPersonalInfoReveal('회원 문의 대응')
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(result.current.reveal.personalInfoRevealed).toBe(true)
    expect(result.current.revealedUser?.phone).toBe(RAW_PHONE)
    expect(client.getQueryData(detailKey)).toBe(masked)
    expect(cacheHasRaw(client)).toBe(false)
  })

  it('상세 닫기(unmount)·회원 전환 후 원문이 남지 않는다', async () => {
    const { result, rerender, unmount } = renderHook(({ u }) => useMemberDetailHarness(u), {
      initialProps: { u: masked },
    })
    await act(async () => {
      await result.current.reveal.revealWithReason('회원 문의 대응')
    })
    rerender({ u: masked2 })
    expect(result.current.revealedUser).toBeNull()
    expect(result.current.reveal.personalInfoRevealed).toBe(false)
    rerender({ u: masked })
    expect(result.current.revealedUser).toBeNull()
    unmount()
    expect(cacheHasRaw(client)).toBe(false)
  })

  it('다시 가리기 이후 늦게 도착한 원문 응답은 버린다(비동기 재유입 차단)', async () => {
    let resolveUnmask: (v: unknown) => void = () => {}
    fetchMemberRolePrivacyUnmask.mockImplementation(
      () => new Promise(resolve => (resolveUnmask = resolve))
    )
    const { result, rerender } = renderHook(({ u }) => useMemberDetailHarness(u), {
      initialProps: { u: masked },
    })
    let pending: Promise<{ ok: boolean }> = Promise.resolve({ ok: false })
    act(() => {
      pending = result.current.reveal.revealWithReason('회원 문의 대응')
    })
    // 응답 전에 다른 회원으로 전환(열람 해제)
    rerender({ u: masked2 })
    rerender({ u: masked })
    await act(async () => {
      resolveUnmask({ phone: RAW_PHONE, email: RAW_EMAIL })
      expect(await pending).toEqual({ ok: false })
    })
    expect(result.current.reveal.personalInfoRevealed).toBe(false)
    expect(result.current.revealedUser).toBeNull()
    expect(cacheHasRaw(client)).toBe(false)
  })
})
