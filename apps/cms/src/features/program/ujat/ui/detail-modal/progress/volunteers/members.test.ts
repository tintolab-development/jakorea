import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  fetchUjatEducationProgressVolunteerMemberCandidates,
  mapVolunteerUserToMemberCandidate,
} from './members'
import type { User } from '@/types/user'

const fetchParticipatingVolunteerMemberCandidates = vi.hoisted(() => vi.fn())

vi.mock('@/features/program/general/lib/participating-volunteer-member-candidates', () => ({
  fetchParticipatingVolunteerMemberCandidates,
}))

vi.mock('@/features/program/general/api/program-progress-remote-capabilities', () => ({
  shouldUseProgramProgressHttpRemoteApi: () => true,
}))

function user(partial: Partial<User> & Pick<User, 'id' | 'name'>): Omit<User, 'password'> {
  return {
    email: `${partial.id}@ja.org`,
    role: 'INDIVIDUAL',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...partial,
  }
}

describe('fetchUjatEducationProgressVolunteerMemberCandidates', () => {
  beforeEach(() => {
    fetchParticipatingVolunteerMemberCandidates.mockReset()
  })

  it('participant-register-candidates SSOT로 후보를 조회한다', async () => {
    fetchParticipatingVolunteerMemberCandidates.mockResolvedValueOnce([
      { memberId: '11', volunteerName: '김봉사자', hasRegisteredId1365: false },
      { memberId: '12', volunteerName: '이미등록', hasRegisteredId1365: true },
    ])

    const options = await fetchUjatEducationProgressVolunteerMemberCandidates('186495', ['12'])

    expect(fetchParticipatingVolunteerMemberCandidates).toHaveBeenCalledWith({
      programId: '186495',
      volunteerKind: 'GENERAL',
      excludedMemberIds: [12],
    })
    expect(options).toEqual([
      { memberId: '11', volunteerName: '김봉사자', hasRegisteredId1365: false },
      { memberId: '12', volunteerName: '이미등록', hasRegisteredId1365: true },
    ])
  })

  it('programId가 없으면 실패한다', async () => {
    await expect(fetchUjatEducationProgressVolunteerMemberCandidates('')).rejects.toThrow(
      /programId/
    )
    expect(fetchParticipatingVolunteerMemberCandidates).not.toHaveBeenCalled()
  })
})

describe('mapVolunteerUserToMemberCandidate', () => {
  it('숫자 memberId를 셀렉트 옵션으로 보존한다', () => {
    expect(
      mapVolunteerUserToMemberCandidate(
        user({ id: 'uuid-1', memberId: 190094, name: '테스트', phone: '010-0000-0000' })
      )
    ).toMatchObject({
      memberId: '190094',
      volunteerName: '테스트',
      mobile: '010-0000-0000',
    })
  })

  it('UUID만 있는 사용자는 null을 반환한다', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(
      mapVolunteerUserToMemberCandidate(user({ id: 'uuid-only', name: '테스트' }))
    ).toBeNull()
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })
})
