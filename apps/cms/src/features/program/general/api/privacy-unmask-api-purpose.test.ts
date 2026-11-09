import { beforeEach, describe, expect, it, vi } from 'vitest'

const customInstance = vi.fn()
const unmaskIndividualMemberPrivacyRemote = vi.fn()

vi.mock('@/shared/api/orval-mutator', () => ({
  default: (...args: unknown[]) => customInstance(...args),
}))
vi.mock('@/features/user/api/members-api-client', () => ({
  unmaskAdminAccountPrivacyRemote: vi.fn(),
  unmaskIndividualMemberPrivacyRemote: (...args: unknown[]) =>
    unmaskIndividualMemberPrivacyRemote(...args),
  unmaskInstructorMemberPrivacyRemote: vi.fn(),
  unmaskInstructorRoleRequestPrivacyRemote: vi.fn(),
  unmaskMemberPrivacyRemote: vi.fn(),
  unmaskTeacherMemberPrivacyRemote: vi.fn(),
}))

import { EDIT_MODE_REVEAL } from '@/shared/lib/privacy-unmask-purpose'
import { fetchMemberRolePrivacyUnmask } from '@/features/user/api/member-privacy-unmask'
import {
  unmaskIndividualApplicationPrivacyRemote,
  unmaskOrganizationApplicationPrivacyRemote,
} from './applications-api-client'

function lastRequestData(): Record<string, unknown> {
  const config = customInstance.mock.calls.at(-1)?.[0] as { data: Record<string, unknown> }
  return config.data
}

describe('unmask API 요청 본문 — 사유로 목적을 추론하지 않는다 (P0)', () => {
  beforeEach(() => {
    customInstance.mockReset()
    customInstance.mockResolvedValue({ data: {} })
    unmaskIndividualMemberPrivacyRemote.mockReset()
    unmaskIndividualMemberPrivacyRemote.mockResolvedValue({})
  })

  it('기관 신청: 수동 사유 「신청 정보 수정」은 purpose 없음, 수정 진입만 EDIT_MODE', async () => {
    await unmaskOrganizationApplicationPrivacyRemote('1691636', '신청 정보 수정', 186565)
    expect(lastRequestData()).toEqual({ reason: '신청 정보 수정', programId: 186565 })

    await unmaskOrganizationApplicationPrivacyRemote(
      '1691636',
      '신청 정보 수정',
      186565,
      EDIT_MODE_REVEAL
    )
    expect(lastRequestData()).toEqual({
      reason: '신청 정보 수정',
      programId: 186565,
      purpose: 'EDIT_MODE',
    })
  })

  it('개인 신청: 수정 진입만 EDIT_MODE', async () => {
    await unmaskIndividualApplicationPrivacyRemote('5', '신청 정보 수정')
    expect(lastRequestData()).toEqual({ reason: '신청 정보 수정' })
    await unmaskIndividualApplicationPrivacyRemote('5', '신청 정보 수정', EDIT_MODE_REVEAL)
    expect(lastRequestData()).toEqual({ reason: '신청 정보 수정', purpose: 'EDIT_MODE' })
  })

  it('회원: 수동 사유 「회원 정보 수정」은 purpose 없음, 수정 진입만 EDIT_MODE', async () => {
    await fetchMemberRolePrivacyUnmask(190081, '회원 정보 수정', 'INDIVIDUAL')
    expect(unmaskIndividualMemberPrivacyRemote).toHaveBeenLastCalledWith(190081, {
      reason: '회원 정보 수정',
    })
    await fetchMemberRolePrivacyUnmask(190045, '회원 정보 수정', 'INDIVIDUAL', EDIT_MODE_REVEAL)
    expect(unmaskIndividualMemberPrivacyRemote).toHaveBeenLastCalledWith(190045, {
      reason: '회원 정보 수정',
      purpose: 'EDIT_MODE',
    })
  })
})
