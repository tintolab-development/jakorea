import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  fetchUjatEducationProgressVolunteerMemberCandidates,
  mapVolunteerUserToMemberCandidate,
} from './members'
import type { User } from '@/types/user'

const fetchAllCmsMembersAndAdminsPageRemote = vi.hoisted(() => vi.fn())

vi.mock('@/features/user/api/members-api-client', () => ({
  fetchAllCmsMembersAndAdminsPageRemote,
}))

vi.mock('@/features/user/api/member-remote-capabilities', () => ({
  isMembersRemoteEnabled: () => true,
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
    fetchAllCmsMembersAndAdminsPageRemote.mockReset()
  })

  it('회원 디렉터리에서 봉사자 역할 회원만 조회한다', async () => {
    fetchAllCmsMembersAndAdminsPageRemote.mockResolvedValueOnce({
      items: [
        {
          accountType: 'MEMBER',
          accountId: 11,
          memberId: 11,
          uuid: 'm-1',
          name: '김봉사자',
          email: 'm-1@ja.org',
          roles: ['USER', 'VOLUNTEER'],
        },
        {
          accountType: 'MEMBER',
          accountId: 12,
          memberId: 12,
          uuid: 'm-2',
          name: '강사회원',
          email: 'm-2@ja.org',
          roles: ['INSTRUCTOR'],
        },
        {
          accountType: 'MEMBER',
          accountId: 13,
          memberId: 13,
          uuid: 'm-3',
          name: '일반회원',
          email: 'm-3@ja.org',
          roles: ['GENERAL'],
        },
      ],
      totalPages: 1,
    })

    const options = await fetchUjatEducationProgressVolunteerMemberCandidates([])

    expect(fetchAllCmsMembersAndAdminsPageRemote).toHaveBeenCalledWith({
      accountType: 'MEMBER',
      page: 0,
      size: 20,
    })
    expect(options.map(o => o.volunteerName)).toEqual(['김봉사자'])
    expect(options.map(o => o.memberId)).toEqual(['11'])
  })

  it('이름·숫자 memberId로 이미 등록된 후보만 제외한다', async () => {
    fetchAllCmsMembersAndAdminsPageRemote.mockResolvedValueOnce({
      items: [
        {
          accountType: 'MEMBER',
          accountId: 21,
          memberId: 21,
          uuid: 'keep',
          name: '남길회원',
          email: 'keep@ja.org',
          roles: ['USER', 'VOLUNTEER'],
        },
        {
          accountType: 'MEMBER',
          accountId: 22,
          memberId: 22,
          uuid: 'by-name',
          name: '중복이름',
          email: 'by-name@ja.org',
          roles: ['USER', 'VOLUNTEER'],
        },
        {
          accountType: 'MEMBER',
          accountId: 23,
          memberId: 23,
          uuid: 'by-id',
          name: '아이디제외',
          email: 'by-id@ja.org',
          roles: ['USER', 'VOLUNTEER'],
        },
      ],
      totalPages: 1,
    })

    const options = await fetchUjatEducationProgressVolunteerMemberCandidates(
      ['중복이름'],
      ['23']
    )

    expect(options.map(o => o.memberId)).toEqual(['21'])
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
