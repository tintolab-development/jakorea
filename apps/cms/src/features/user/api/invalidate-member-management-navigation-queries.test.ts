import { describe, expect, it } from 'vitest'
import { QueryClient } from '@tanstack/react-query'
import { memberQueryKeys } from '@/features/user/api/member-query-keys'
import { memberListHref } from '@/shared/config/member-list-kinds'
import {
  invalidateAdminPermissionsQueries,
  invalidatePermissionApprovalListQueries,
  invalidateQueriesForMemberManagementNavigation,
} from './invalidate-member-management-navigation-queries'

describe('invalidatePermissionApprovalListQueries', () => {
  it('강사·관리자 권한 신청 목록 쿼리를 stale로 표시한다', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    queryClient.setQueryData(memberQueryKeys.instructorRoleRequests.list('p0'), { rows: [] })
    queryClient.setQueryData(memberQueryKeys.adminApprovalRequests.list('p0'), { rows: [] })

    invalidatePermissionApprovalListQueries(queryClient)
    await Promise.resolve()

    expect(
      queryClient.getQueryState(memberQueryKeys.instructorRoleRequests.list('p0'))?.isInvalidated
    ).toBe(true)
    expect(
      queryClient.getQueryState(memberQueryKeys.adminApprovalRequests.list('p0'))?.isInvalidated
    ).toBe(true)
  })
})

describe('invalidateAdminPermissionsQueries', () => {
  it('adminPermissions prefix 쿼리를 stale로 표시한다', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    queryClient.setQueryData(memberQueryKeys.adminPermissions.catalog(), [])

    invalidateAdminPermissionsQueries(queryClient)
    await Promise.resolve()

    expect(
      queryClient.getQueryState(memberQueryKeys.adminPermissions.catalog())?.isInvalidated
    ).toBe(true)
  })
})

describe('invalidateQueriesForMemberManagementNavigation', () => {
  it('권한 승인 경로면 approval 목록만 invalidate한다', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    queryClient.setQueryData(memberQueryKeys.list('all'), { pages: [], pageParams: [] })
    queryClient.setQueryData(memberQueryKeys.instructorRoleRequests.list('p0'), { rows: [] })

    invalidateQueriesForMemberManagementNavigation(queryClient, '/admin/permission-requests')
    await Promise.resolve()

    expect(queryClient.getQueryState(memberQueryKeys.list('all'))?.isInvalidated).toBeFalsy()
    expect(
      queryClient.getQueryState(memberQueryKeys.instructorRoleRequests.list('p0'))?.isInvalidated
    ).toBe(true)
  })

  it('회원 목록 href면 member list invalidate에 위임한다', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    queryClient.setQueryData(memberQueryKeys.list('all'), { pages: [], pageParams: [] })

    invalidateQueriesForMemberManagementNavigation(queryClient, memberListHref('instructors'))
    await Promise.resolve()

    expect(queryClient.getQueryState(memberQueryKeys.list('all'))?.isInvalidated).toBe(true)
  })

  it('관리자 권한 설정 경로면 adminPermissions를 invalidate한다', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    queryClient.setQueryData(memberQueryKeys.adminPermissions.roles(), [])

    invalidateQueriesForMemberManagementNavigation(queryClient, '/admin/settings/permissions')
    await Promise.resolve()

    expect(
      queryClient.getQueryState(memberQueryKeys.adminPermissions.roles())?.isInvalidated
    ).toBe(true)
  })

  it('프로그램 담당자 권한 설정 경로는 정적 권한표이므로 회원 쿼리를 invalidate하지 않는다', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    queryClient.setQueryData(memberQueryKeys.adminPermissions.roles(), [])
    queryClient.setQueryData(memberQueryKeys.list('all'), { pages: [], pageParams: [] })

    invalidateQueriesForMemberManagementNavigation(
      queryClient,
      '/admin/settings/program-manager-permissions?role=owner'
    )
    await Promise.resolve()

    expect(
      queryClient.getQueryState(memberQueryKeys.adminPermissions.roles())?.isInvalidated
    ).toBeFalsy()
    expect(queryClient.getQueryState(memberQueryKeys.list('all'))?.isInvalidated).toBeFalsy()
  })
})
