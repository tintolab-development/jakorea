import { describe, expect, it, vi } from 'vitest'
import type { QueryClient } from '@tanstack/react-query'
import { fetchMemberDetailBasicTabResources, shouldFetchMemberConsentRecords } from './fetch-member-detail-basic-tab-resources'

vi.mock('@/features/user/api/hooks/use-member-detail-query', () => ({
  fetchMemberConsentRecordsQuery: vi.fn().mockResolvedValue([]),
}))

vi.mock('@/features/user/api/hooks/use-member-detail-subresource-queries', () => ({
  fetchAffiliatedTeachersQuery: vi.fn().mockResolvedValue([]),
  fetchMemberCommentsQuery: vi.fn().mockResolvedValue(undefined),
}))

import { fetchMemberConsentRecordsQuery } from '@/features/user/api/hooks/use-member-detail-query'
import {
  fetchAffiliatedTeachersQuery,
  fetchMemberCommentsQuery,
} from '@/features/user/api/hooks/use-member-detail-subresource-queries'
import { MEMBER_DETAIL_SCREEN_CODE } from '@/features/user/api/map-member-comments'

describe('shouldFetchMemberConsentRecords', () => {
  it('개인·강사는 memberId가 있으면 true', () => {
    expect(
      shouldFetchMemberConsentRecords({
        role: 'INDIVIDUAL',
        memberId: 2,
        showConsentAgreement: true,
      })
    ).toBe(true)
    expect(
      shouldFetchMemberConsentRecords({
        role: 'INSTRUCTOR',
        memberId: 3,
        showConsentAgreement: true,
      })
    ).toBe(true)
  })

  it('관리자이거나 memberId가 없으면 false', () => {
    expect(
      shouldFetchMemberConsentRecords({
        role: 'ADMIN',
        memberId: 9,
        showConsentAgreement: true,
      })
    ).toBe(false)
    expect(
      shouldFetchMemberConsentRecords({
        role: 'INDIVIDUAL',
        memberId: undefined,
        showConsentAgreement: true,
      })
    ).toBe(false)
  })
})

describe('fetchMemberDetailBasicTabResources', () => {
  it('개인 detail-info — consent-records fetch', async () => {
    const queryClient = {} as QueryClient

    await fetchMemberDetailBasicTabResources(queryClient, {
      detailTabActive: true,
      membersRemote: true,
      displayUser: { role: 'INDIVIDUAL', memberId: 2, id: 'user-2' },
      mode: 'default',
      showConsentAgreement: true,
      showSchoolAffiliatedTeachers: false,
    })

    expect(fetchMemberConsentRecordsQuery).toHaveBeenCalledWith(queryClient, 2)
    expect(fetchAffiliatedTeachersQuery).not.toHaveBeenCalled()
  })

  it('학교 detail-info — 소속 교사 fetch', async () => {
    vi.mocked(fetchMemberConsentRecordsQuery).mockClear()
    vi.mocked(fetchAffiliatedTeachersQuery).mockClear()
    vi.mocked(fetchMemberCommentsQuery).mockClear()
    const queryClient = {} as QueryClient

    await fetchMemberDetailBasicTabResources(queryClient, {
      detailTabActive: true,
      membersRemote: true,
      displayUser: { role: 'SCHOOL', memberId: 10, organizationId: 5, id: 'organization-5' },
      mode: 'default',
      showConsentAgreement: false,
      showSchoolAffiliatedTeachers: true,
      organizationId: 5,
      currentUser: { role: 'ADMIN' },
    })

    expect(fetchMemberConsentRecordsQuery).not.toHaveBeenCalled()
    expect(fetchAffiliatedTeachersQuery).toHaveBeenCalledWith(queryClient, {
      memberId: 10,
      organizationId: 5,
    })
    expect(fetchMemberCommentsQuery).toHaveBeenCalledWith(
      queryClient,
      5,
      MEMBER_DETAIL_SCREEN_CODE,
      'schoolOrganization'
    )
  })

  it('관리자 상세는 consent-records를 호출하지 않는다', async () => {
    vi.mocked(fetchMemberConsentRecordsQuery).mockClear()
    const queryClient = {} as QueryClient

    await fetchMemberDetailBasicTabResources(queryClient, {
      detailTabActive: true,
      membersRemote: true,
      displayUser: { role: 'ADMIN', id: 'admin-account-3' },
      mode: 'default',
      showConsentAgreement: true,
      showSchoolAffiliatedTeachers: false,
    })

    expect(fetchMemberConsentRecordsQuery).not.toHaveBeenCalled()
  })

  it('history 탭이면 fetch하지 않음', async () => {
    vi.mocked(fetchMemberConsentRecordsQuery).mockClear()
    vi.mocked(fetchAffiliatedTeachersQuery).mockClear()
    const queryClient = {} as QueryClient

    await fetchMemberDetailBasicTabResources(queryClient, {
      detailTabActive: false,
      membersRemote: true,
      displayUser: { role: 'SCHOOL', memberId: 10, organizationId: 5, id: 'school-5' },
      mode: 'default',
      showConsentAgreement: false,
      showSchoolAffiliatedTeachers: true,
      organizationId: 5,
    })

    expect(fetchMemberConsentRecordsQuery).not.toHaveBeenCalled()
    expect(fetchAffiliatedTeachersQuery).not.toHaveBeenCalled()
  })
})
