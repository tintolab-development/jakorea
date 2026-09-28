import { describe, expect, it, vi, beforeEach } from 'vitest'

const unmaskInstructorMemberPrivacyRemote = vi.fn()
const unmaskIndividualMemberPrivacyRemote = vi.fn()
const unmaskMemberPrivacyRemote = vi.fn()

vi.mock('@/features/user/api/members-api-client', () => ({
  unmaskAdminAccountPrivacyRemote: vi.fn(),
  unmaskIndividualMemberPrivacyRemote: (...args: unknown[]) =>
    unmaskIndividualMemberPrivacyRemote(...args),
  unmaskInstructorMemberPrivacyRemote: (...args: unknown[]) =>
    unmaskInstructorMemberPrivacyRemote(...args),
  unmaskInstructorRoleRequestPrivacyRemote: vi.fn(),
  unmaskMemberPrivacyRemote: (...args: unknown[]) => unmaskMemberPrivacyRemote(...args),
}))

import { fetchMemberRolePrivacyUnmask } from './member-privacy-unmask'

describe('fetchMemberRolePrivacyUnmask', () => {
  beforeEach(() => {
    unmaskInstructorMemberPrivacyRemote.mockReset()
    unmaskIndividualMemberPrivacyRemote.mockReset()
    unmaskMemberPrivacyRemote.mockReset()
    unmaskInstructorMemberPrivacyRemote.mockResolvedValue({ member: { memberId: 1 } })
    unmaskIndividualMemberPrivacyRemote.mockResolvedValue({ member: { memberId: 1 } })
    unmaskMemberPrivacyRemote.mockResolvedValue({ memberId: 1 })
  })

  it('순수 교사는 instructor unmask가 아니라 legacy member unmask를 호출한다', async () => {
    await fetchMemberRolePrivacyUnmask(190001, '열람', 'INSTRUCTOR', {
      instructorMemberProfile: 'school_teacher',
    })

    expect(unmaskMemberPrivacyRemote).toHaveBeenCalledWith(190001, { reason: '열람' })
    expect(unmaskInstructorMemberPrivacyRemote).not.toHaveBeenCalled()
  })

  it('강사·겸직은 instructor unmask를 호출한다', async () => {
    await fetchMemberRolePrivacyUnmask(10, '열람', 'INSTRUCTOR', {
      instructorMemberProfile: 'instructor_only',
    })
    expect(unmaskInstructorMemberPrivacyRemote).toHaveBeenCalledWith(10, { reason: '열람' })

    unmaskInstructorMemberPrivacyRemote.mockClear()
    await fetchMemberRolePrivacyUnmask(11, '열람', 'INSTRUCTOR', {
      instructorMemberProfile: 'instructor_dual',
    })
    expect(unmaskInstructorMemberPrivacyRemote).toHaveBeenCalledWith(11, { reason: '열람' })
  })

  it('개인 회원은 individual unmask를 호출한다', async () => {
    await fetchMemberRolePrivacyUnmask(20, '열람', 'INDIVIDUAL')
    expect(unmaskIndividualMemberPrivacyRemote).toHaveBeenCalledWith(20, { reason: '열람' })
  })
})
