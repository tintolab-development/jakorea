import { describe, expect, it, vi } from 'vitest'
import { QueryClient } from '@tanstack/react-query'
import { memberDetailQueryOptions } from './use-member-detail-query'

const fetchTeacherMemberDetailRemote = vi.fn()
const fetchInstructorMemberDetailRemote = vi.fn()
const fetchMemberExternalIdentifiersRemote = vi.fn()

vi.mock('@/features/user/api/members-api-client', () => ({
  fetchTeacherMemberDetailRemote: (...args: unknown[]) =>
    fetchTeacherMemberDetailRemote(...args),
  fetchInstructorMemberDetailRemote: (...args: unknown[]) =>
    fetchInstructorMemberDetailRemote(...args),
  fetchMemberExternalIdentifiersRemote: (...args: unknown[]) =>
    fetchMemberExternalIdentifiersRemote(...args),
  fetchIndividualMemberDetailRemote: vi.fn(),
  fetchMemberDetailRemote: vi.fn(),
  fetchMemberConsentRecordsRemote: vi.fn(),
  fetchSchoolMemberDetailRemote: vi.fn(),
  fetchSchoolOrganizationRemote: vi.fn(),
}))

vi.mock('@/features/user/api/map-member-detail-to-user', () => ({
  mapTeacherMemberDetailToUser: vi.fn(() => ({ id: 'teacher-1', role: 'INSTRUCTOR' })),
  mapInstructorMemberDetailToUser: vi.fn(() => ({ id: 'instructor-1', role: 'INSTRUCTOR' })),
  mapIndividualMemberDetailToUser: vi.fn(),
  mapMemberDetailToUser: vi.fn(),
  mapSchoolMemberDetailToUser: vi.fn(),
}))

vi.mock('@/features/user/api/fetch-admin-member-detail', () => ({
  fetchAdminMemberDetailAsUser: vi.fn(),
  isAdminMemberDetailRole: vi.fn(() => false),
  shouldUseAdminAccountDetailApi: vi.fn(() => false),
  parseAdminAccountIdFromUserId: (userId: string) => {
    const match = userId.match(/^admin-account-(\d+)$/)
    return match ? Number(match[1]) : undefined
  },
}))

vi.mock('@/features/user/api/map-school-organization-to-user', () => ({
  mapSchoolOrganizationToUser: vi.fn(),
  parseOrganizationIdFromUserId: vi.fn(() => undefined),
  shouldFetchSchoolOrganizationDetail: vi.fn(() => false),
}))

vi.mock('@/features/user/api/member-id-registry', () => ({
  resolveMemberIdForApi: vi.fn(() => 99),
}))

vi.mock('@/features/user/api/member-remote-capabilities', () => ({
  isMembersRemoteEnabled: vi.fn(() => true),
}))

vi.mock('@/features/user/api/map-external-identifiers', () => ({
  resolve1365IdFromExternalIdentifiers: vi.fn(() => undefined),
}))

describe('memberDetailQueryOptions shell GET routing', () => {
  it('교사 상세는 /teacher API를 사용한다', async () => {
    fetchTeacherMemberDetailRemote.mockResolvedValue({ member: { memberId: 99 } })
    fetchInstructorMemberDetailRemote.mockResolvedValue({ member: { memberId: 99 } })
    fetchMemberExternalIdentifiersRemote.mockResolvedValue([])

    const detailOptions = memberDetailQueryOptions('member-99', {
      role: 'INSTRUCTOR',
      memberId: 99,
      instructorMemberProfile: 'school_teacher',
    })
    const user = await detailOptions.queryFn!({
      client: new QueryClient(),
      queryKey: detailOptions.queryKey,
      signal: new AbortController().signal,
      meta: undefined,
    })

    expect(fetchTeacherMemberDetailRemote).toHaveBeenCalledWith(99)
    expect(fetchInstructorMemberDetailRemote).not.toHaveBeenCalled()
    expect(user.id).toBe('teacher-1')
  })

  it('순수·겸직 강사 상세는 /instructor API를 사용한다', async () => {
    fetchTeacherMemberDetailRemote.mockClear()
    fetchInstructorMemberDetailRemote.mockClear()
    fetchTeacherMemberDetailRemote.mockResolvedValue({ member: { memberId: 99 } })
    fetchInstructorMemberDetailRemote.mockResolvedValue({ member: { memberId: 99 } })
    fetchMemberExternalIdentifiersRemote.mockResolvedValue([])

    const detailOptions = memberDetailQueryOptions('member-99', {
      role: 'INSTRUCTOR',
      memberId: 99,
      instructorMemberProfile: 'instructor_dual',
    })
    const user = await detailOptions.queryFn!({
      client: new QueryClient(),
      queryKey: detailOptions.queryKey,
      signal: new AbortController().signal,
      meta: undefined,
    })

    expect(fetchInstructorMemberDetailRemote).toHaveBeenCalledWith(99)
    expect(fetchTeacherMemberDetailRemote).not.toHaveBeenCalled()
    expect(user.id).toBe('instructor-1')
  })
})

describe('memberDetailQueryKey cache identity', () => {
  it('uuid와 admin-account-{id}가 같은 adminAccountId면 queryKey가 같다', () => {
    const fromList = memberDetailQueryOptions('uuid-admin', {
      role: 'ADMIN',
      adminAccountId: 171601,
    })
    const fromCanonical = memberDetailQueryOptions('admin-account-171601', {
      role: 'ADMIN',
      adminAccountId: 171601,
    })
    expect(fromList.queryKey).toEqual(fromCanonical.queryKey)
  })

  it('organizationId가 같으면 userId가 달라도 queryKey가 같다', () => {
    const fromList = memberDetailQueryOptions('uuid-school', {
      role: 'SCHOOL',
      organizationId: 171601,
    })
    const fromCanonical = memberDetailQueryOptions('organization-171601', {
      role: 'SCHOOL',
      organizationId: 171601,
    })
    expect(fromList.queryKey).toEqual(fromCanonical.queryKey)
  })
})
