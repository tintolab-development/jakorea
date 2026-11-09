/** @vitest-environment jsdom */
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const fetchMemberRolePrivacyUnmask = vi.fn()

vi.mock('@/features/user/api/member-privacy-unmask', () => ({
  fetchMemberRolePrivacyUnmask: (...args: unknown[]) => fetchMemberRolePrivacyUnmask(...args),
  fetchAdminAccountPrivacyUnmask: vi.fn(),
  fetchInstructorRoleRequestPrivacyUnmask: vi.fn(),
}))
vi.mock('@/features/user/api/member-remote-capabilities', () => ({
  isMembersRemoteEnabled: () => true,
}))
vi.mock('@/shared/lib/admin-role-policy', () => ({
  guardAdminAction: () => true,
  resolveAdminRoleCodeFromUser: () => 'MASTER',
  showAdminAccessDeniedAlert: vi.fn(),
}))
vi.mock('@/features/user/detail/lib/use-my-program-privacy-role', () => ({
  useMyProgramPrivacyRole: () => ({
    pending: false,
    canRevealGeneral: true,
    canRevealSensitive: true,
    refetch: () =>
      Promise.resolve({
        assigned: true,
        assignmentRole: 'PM',
        capabilities: ['PROGRAM_VIEW', 'SENSITIVE_PII_READ'],
      }),
  }),
}))
vi.mock('@/features/user/detail/ui/modal/user-personal-info-reveal-confirm-modal', () => ({
  UserPersonalInfoRevealConfirmModal: () => null,
}))
vi.mock('@/shared/ui/cms-alert-modal-api', () => ({ cmsAlertModal: { show: vi.fn() } }))

import { QueryClient } from '@tanstack/react-query'
import { EDIT_MODE_REVEAL } from '@/shared/lib/privacy-unmask-purpose'
import { generalApplicationsQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import { cacheProjectedProgramPrivacy } from '@/features/program/shared/lib/program-my-assignment'
import { usePersonalInfoReveal } from './use-personal-info-reveal'

function renderMemberReveal(revealPersonalInfo?: (reason: string, options?: unknown) => Promise<unknown>) {
  return renderHook(() =>
    usePersonalInfoReveal({
      resolveAccessItem: () => '회원 상세 정보',
      resolveMemberId: () => '190081',
      resolveMemberRole: () => 'INDIVIDUAL',
      revealPersonalInfo,
      resetDeps: [],
      controlMode: 'hideWhenRevealed',
    })
  )
}

describe('usePersonalInfoReveal — 수동 열람과 수정 진입 목적 분리 (P0)', () => {
  beforeEach(() => {
    fetchMemberRolePrivacyUnmask.mockReset()
    fetchMemberRolePrivacyUnmask.mockResolvedValue({ phone: '010-1234-5678' })
  })

  it('수동 상세보기에서 사유 「회원 정보 수정」을 입력해도 purpose를 보내지 않는다', async () => {
    const { result } = renderMemberReveal()
    await act(async () => {
      result.current.submitPersonalInfoReveal('회원 정보 수정')
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(fetchMemberRolePrivacyUnmask).toHaveBeenCalledTimes(1)
    const [, reason, , options] = fetchMemberRolePrivacyUnmask.mock.calls[0]
    expect(reason).toBe('회원 정보 수정')
    expect((options as { purpose?: string }).purpose).toBeUndefined()
  })

  it('실제 회원 수정 진입은 EDIT_MODE를 명시해 보낸다', async () => {
    const { result } = renderMemberReveal()
    await act(async () => {
      await result.current.revealWithReason('회원 정보 수정', EDIT_MODE_REVEAL)
    })
    const [, , , options] = fetchMemberRolePrivacyUnmask.mock.calls[0]
    expect((options as { purpose?: string }).purpose).toBe('EDIT_MODE')
    expect(result.current.personalInfoRevealed).toBe(true)
  })

  it('화면 전용 원문 API(신청 상세)도 수동은 목적 없음, 수정 진입은 EDIT_MODE를 넘긴다', async () => {
    const revealPersonalInfo = vi.fn().mockResolvedValue({ teacherPhone: '010-1234-5678' })
    const { result } = renderMemberReveal(revealPersonalInfo)
    await act(async () => {
      await result.current.revealWithReason('신청 정보 수정')
    })
    expect(revealPersonalInfo).toHaveBeenLastCalledWith('신청 정보 수정', undefined)
    await act(async () => {
      await result.current.revealWithReason('신청 정보 수정', EDIT_MODE_REVEAL)
    })
    expect(revealPersonalInfo).toHaveBeenLastCalledWith('신청 정보 수정', { purpose: 'EDIT_MODE' })
  })

  it('remaskPersonalInfo는 원문 재조회 없이 마스킹 상태로 되돌린다', async () => {
    const { result } = renderMemberReveal()
    await act(async () => {
      await result.current.revealWithReason('회원 정보 수정', EDIT_MODE_REVEAL)
    })
    act(() => result.current.remaskPersonalInfo())
    expect(result.current.personalInfoRevealed).toBe(false)
    expect(fetchMemberRolePrivacyUnmask).toHaveBeenCalledTimes(1)
  })
})

describe('usePersonalInfoReveal — 신청 수정 취소 재마스킹 (CMS-29)', () => {
  it('프로그램 범위에서 remask하면 원문을 쓴 신청 상세 캐시를 즉시 비운다', async () => {
    const client = new QueryClient()
    const key = generalApplicationsQueryKeys.organizationDetail('1691636')
    const revealPersonalInfo = vi.fn(async () =>
      cacheProjectedProgramPrivacy(client, key, 186565, { teacherPhone: '010-1234-5678' })
    )
    const { result } = renderHook(() =>
      usePersonalInfoReveal({
        privacyScope: 'program',
        programId: '186565',
        resolveAccessItem: () => '기관 신청 상세',
        revealPersonalInfo,
        resetDeps: [],
        controlMode: 'hideWhenRevealed',
      })
    )
    await act(async () => {
      await result.current.revealWithReason('신청 정보 수정', EDIT_MODE_REVEAL)
    })
    expect(result.current.personalInfoRevealed).toBe(true)
    expect(client.getQueryData(key)).toMatchObject({ teacherPhone: '010-1234-5678' })

    await act(async () => {
      result.current.remaskPersonalInfo()
      await Promise.resolve()
    })
    expect(result.current.personalInfoRevealed).toBe(false)
    expect(client.getQueryData(key)).toBeUndefined()
    expect(revealPersonalInfo).toHaveBeenCalledTimes(1)
  })
})
