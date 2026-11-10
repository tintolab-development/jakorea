/** @vitest-environment jsdom */
import { act, renderHook } from '@testing-library/react'
import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/features/user/api/member-privacy-unmask', () => ({
  fetchMemberRolePrivacyUnmask: vi.fn(),
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
  useMyProgramPrivacyRole: () => ({
    pending: false,
    canRevealGeneral: true,
    canRevealSensitive: true,
    refetch: () =>
      Promise.resolve({ assigned: true, assignmentRole: 'PM', capabilities: ['PROGRAM_VIEW', 'SENSITIVE_PII_READ'] }),
  }),
}))
vi.mock('@/features/user/detail/ui/modal/user-personal-info-reveal-confirm-modal', () => ({
  UserPersonalInfoRevealConfirmModal: () => null,
}))
vi.mock('@/shared/ui/cms-alert-modal-api', () => ({ cmsAlertModal: { show: vi.fn() } }))

import { EDIT_MODE_REVEAL } from '@/shared/lib/privacy-unmask-purpose'
import { generalApplicationsQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import { cacheProjectedProgramPrivacy } from '@/features/program/shared/lib/program-my-assignment'
import { usePersonalInfoReveal } from './use-personal-info-reveal'

describe('신청 상세 원문 응답 경합 (Step 5 P1 비동기 재유입)', () => {
  it('취소(다시 가리기) 뒤 도착한 원문 응답은 오버레이·캐시에 남지 않는다', async () => {
    const client = new QueryClient()
    const key = generalApplicationsQueryKeys.organizationDetail('1691636')
    let release: () => void = () => {}
    const revealPersonalInfo = vi.fn(async () => {
      await new Promise<void>(resolve => (release = resolve))
      // 화면 콜백이 응답을 받자마자 원문을 캐시에 쓴다(실제 신청 상세와 동일)
      return cacheProjectedProgramPrivacy(client, key, '186565', { teacherPhone: '010-1234-5678' })
    })
    const onPrivacyUnmasked = vi.fn()
    const onRemask = vi.fn()
    const { result } = renderHook(() =>
      usePersonalInfoReveal({
        privacyScope: 'program',
        programId: '186565',
        resolveAccessItem: () => '기관 신청 상세',
        revealPersonalInfo,
        onPrivacyUnmasked,
        onRemask,
        resetDeps: [],
        controlMode: 'hideWhenRevealed',
      })
    )
    let pending: Promise<{ ok: boolean }> = Promise.resolve({ ok: false })
    await act(async () => {
      pending = result.current.revealWithReason('신청 정보 수정', EDIT_MODE_REVEAL)
      await Promise.resolve()
    })
    act(() => result.current.remaskPersonalInfo())
    await act(async () => {
      release()
      expect(await pending).toEqual({ ok: false })
    })
    expect(onPrivacyUnmasked).not.toHaveBeenCalled()
    expect(result.current.personalInfoRevealed).toBe(false)
    expect(client.getQueryData(key)).toBeUndefined()
  })
})
