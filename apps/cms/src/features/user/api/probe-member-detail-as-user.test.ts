import { beforeEach, describe, expect, it, vi } from 'vitest'

const fetchIndividualMemberDetailRemote = vi.fn()
const fetchMemberExternalIdentifiersRemote = vi.fn()
const fetchSchoolMemberDetailRemote = vi.fn()
const fetchInstructorMemberDetailRemote = vi.fn()
const fetchTeacherMemberDetailRemote = vi.fn()

vi.mock('@/features/user/api/members-api-client', () => ({
  fetchIndividualMemberDetailRemote: (...args: unknown[]) =>
    fetchIndividualMemberDetailRemote(...args),
  fetchMemberExternalIdentifiersRemote: (...args: unknown[]) =>
    fetchMemberExternalIdentifiersRemote(...args),
  fetchSchoolMemberDetailRemote: (...args: unknown[]) => fetchSchoolMemberDetailRemote(...args),
  fetchInstructorMemberDetailRemote: (...args: unknown[]) =>
    fetchInstructorMemberDetailRemote(...args),
  fetchTeacherMemberDetailRemote: (...args: unknown[]) =>
    fetchTeacherMemberDetailRemote(...args),
}))

vi.mock('@/features/user/api/fetch-admin-member-detail', () => ({
  fetchAdminMemberDetailAsUser: vi.fn(),
  isAdminMemberDetailRole: (role: string) => role === 'ADMIN',
  shouldUseAdminAccountDetailApi: () => false,
}))

import { probeMemberDetailAsUser } from './probe-member-detail-as-user'

describe('probeMemberDetailAsUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fetchMemberExternalIdentifiersRemote.mockResolvedValue([])
  })

  it('individual 응답이면 GET을 한 번만 하고 재호출하지 않는다', async () => {
    fetchIndividualMemberDetailRemote.mockResolvedValue({
      member: {
        id: 1,
        roles: ['INDIVIDUAL'],
        name: '김틴토',
        email: 'a@b.com',
      },
    })

    const user = await probeMemberDetailAsUser('member-1', 1)

    expect(user.name).toBe('김틴토')
    expect(fetchIndividualMemberDetailRemote).toHaveBeenCalledTimes(1)
    expect(fetchSchoolMemberDetailRemote).not.toHaveBeenCalled()
    expect(fetchInstructorMemberDetailRemote).not.toHaveBeenCalled()
  })

  it('SCHOOL_TEACHER 단독 roles는 teacher 상세 GET을 쓴다', async () => {
    fetchIndividualMemberDetailRemote.mockResolvedValue({
      member: {
        memberId: 10,
        roles: ['SCHOOL_TEACHER'],
        name: '김교사',
        email: 't@b.com',
      },
    })
    fetchTeacherMemberDetailRemote.mockResolvedValue({
      member: {
        memberId: 10,
        roles: ['SCHOOL_TEACHER'],
        name: '김교사',
        email: 't@b.com',
      },
      organizationName: '진월초등학교',
    })

    const user = await probeMemberDetailAsUser('member-10', 10)

    expect(user.instructorMemberProfile).toBe('school_teacher')
    expect(fetchTeacherMemberDetailRemote).toHaveBeenCalledTimes(1)
    expect(fetchInstructorMemberDetailRemote).not.toHaveBeenCalled()
  })
})
