import { queryOptions, useQuery, type QueryClient } from '@tanstack/react-query'
import { memberQueryKeys } from '@/features/user/api/member-query-keys'
import {
  fetchAffiliatedTeachersRemote,
  fetchAdminAccountProgramRolesRemote,
  fetchMemberAdminProgramsRemote,
  fetchMemberApplicationsRemote,
  fetchMemberCommentsRemote,
  fetchMemberProgramHistoryRemote,
  fetchSchoolTeachersRemote,
  fetchSchoolOrganizationProgramEnrollmentHistoryRemote,
} from '@/features/user/api/members-api-client'
import { fetchSchoolOrganizationProgramEnrollmentHistoryMock } from '@/features/user/api/fetch-school-organization-program-enrollment-history-mock'
import { mapSchoolOrganizationProgramEnrollmentHistoryItems } from '@/features/user/api/map-school-organization-program-enrollment-history'
import type { ListSchoolOrganizationProgramEnrollmentHistoryParams } from '@/features/user/api/school-organization-program-enrollment-history.types'
import { mapAffiliatedTeacherRows } from '@/features/user/api/map-affiliated-teacher-row'
import { mapMemberAdminPrograms } from '@/features/user/api/map-member-admin-program'
import {
  mapMemberApplicationHistoryItems,
  filterApplicationsBySubjectType,
} from '@/features/user/api/map-member-application-history'
import {
  mapMemberProgramHistoryItems,
  mapMemberProgramHistoryToEnrollmentApplications,
} from '@/features/user/api/map-member-program-history'
import {
  MEMBER_DETAIL_SCREEN_CODE,
  resolveLatestMemberAdminComment,
  resolveLatestMemberAdminCommentDetail,
} from '@/features/user/api/map-member-comments'
import type { AdminCommentResourceTarget } from '@/features/user/api/resolve-admin-comment-resource'
import { getMemberApiErrorMessage } from '@/features/user/api/get-member-api-error'
import { isMembersRemoteEnabled } from '@/features/user/api/member-remote-capabilities'
import type { Application } from '@/types/domain'
import type { UserHistory } from '@/types/domain'
import type { Program } from '@/types/domain'
import type { SchoolAffiliatedTeacherRow } from '@/types/user'

const MEMBER_DETAIL_LIST_SIZE = 50
/** history LNB 탭 전환 시 동일 memberId 재GET 방지 (전역 30s와 동일) */
const MEMBER_DETAIL_SUBRESOURCE_STALE_MS = 30_000

type MemberDetailSubresourceQueryOptions = {
  /** true면 useQuery 자동 fetch 비활성 — 탭 진입 effect에서 ensureQueryData로 1회만 호출 */
  manualFetch?: boolean
}

export function memberApplicationsQueryOptions(memberId: number, userId: string) {
  return queryOptions({
    queryKey: memberQueryKeys.applications(memberId),
    staleTime: MEMBER_DETAIL_SUBRESOURCE_STALE_MS,
    // enrollment-summary N+1은 활성 history child(수강/강의)에서만 보강한다.
    queryFn: async (): Promise<Application[]> => {
      const res = await fetchMemberApplicationsRemote(memberId, {
        page: 0,
        size: MEMBER_DETAIL_LIST_SIZE,
      })
      return mapMemberApplicationHistoryItems(res.items, userId)
    },
    meta: {
      errorMessage: (error: unknown) =>
        getMemberApiErrorMessage(error, '프로그램 신청 이력을 불러오지 못했습니다.'),
    },
  })
}

export function memberProgramHistoryQueryOptions(memberId: number, userId: string) {
  return queryOptions({
    queryKey: memberQueryKeys.programHistory(memberId),
    staleTime: MEMBER_DETAIL_SUBRESOURCE_STALE_MS,
    queryFn: async (): Promise<{
      volunteerHistories: UserHistory[]
      enrollmentFromHistory: Application[]
    }> => {
      const res = await fetchMemberProgramHistoryRemote(memberId, {
        page: 0,
        size: MEMBER_DETAIL_LIST_SIZE,
      })
      const items = res.items ?? []
      return {
        volunteerHistories: mapMemberProgramHistoryItems(items, userId),
        enrollmentFromHistory: mapMemberProgramHistoryToEnrollmentApplications(items, userId),
      }
    },
    meta: {
      errorMessage: (error: unknown) =>
        getMemberApiErrorMessage(error, '프로그램 참여 이력을 불러오지 못했습니다.'),
    },
  })
}

export function schoolOrganizationProgramEnrollmentHistoryQueryOptions(
  organizationId: number,
  organizationUserId: string,
  params?: ListSchoolOrganizationProgramEnrollmentHistoryParams
) {
  const filtersKey = JSON.stringify(params ?? {})
  const membersRemote = isMembersRemoteEnabled()
  return queryOptions({
    queryKey: memberQueryKeys.schoolProgramEnrollmentHistory(
      organizationId,
      filtersKey,
      membersRemote ? '' : organizationUserId
    ),
    staleTime: MEMBER_DETAIL_SUBRESOURCE_STALE_MS,
    queryFn: async (): Promise<Application[]> => {
      if (!membersRemote) {
        return fetchSchoolOrganizationProgramEnrollmentHistoryMock(organizationUserId)
      }
      const res = await fetchSchoolOrganizationProgramEnrollmentHistoryRemote(organizationId, {
        page: 0,
        size: MEMBER_DETAIL_LIST_SIZE,
        ...params,
      })
      return mapSchoolOrganizationProgramEnrollmentHistoryItems(res.items, organizationUserId)
    },
    meta: {
      errorMessage: (error: unknown) =>
        getMemberApiErrorMessage(error, '프로젝트 수강 이력을 불러오지 못했습니다.'),
    },
  })
}

export function fetchMemberApplicationsQuery(
  queryClient: QueryClient,
  memberId: number,
  userId: string
) {
  return queryClient.ensureQueryData(memberApplicationsQueryOptions(memberId, userId))
}

export function fetchMemberProgramHistoryQuery(
  queryClient: QueryClient,
  memberId: number,
  userId: string
) {
  return queryClient.ensureQueryData(memberProgramHistoryQueryOptions(memberId, userId))
}

export function fetchSchoolOrganizationProgramEnrollmentHistoryQuery(
  queryClient: QueryClient,
  organizationId: number,
  organizationUserId: string,
  params?: ListSchoolOrganizationProgramEnrollmentHistoryParams
) {
  return queryClient.ensureQueryData(
    schoolOrganizationProgramEnrollmentHistoryQueryOptions(
      organizationId,
      organizationUserId,
      params
    )
  )
}

export function memberCommentsQueryOptions(
  resourceId: number,
  screenCode = MEMBER_DETAIL_SCREEN_CODE,
  target: AdminCommentResourceTarget = 'member'
) {
  return queryOptions({
    queryKey: memberQueryKeys.comments(resourceId, screenCode, target),
    staleTime: 30_000,
    queryFn: async () => {
      const comments = await fetchMemberCommentsRemote(resourceId, { screenCode })
      return {
        comments,
        latestComment: resolveLatestMemberAdminComment(comments, screenCode),
        latestCommentDetail: resolveLatestMemberAdminCommentDetail(comments, screenCode),
      }
    },
    meta: {
      errorMessage: (error: unknown) =>
        getMemberApiErrorMessage(error, '관리자 코멘트를 불러오지 못했습니다.'),
    },
  })
}

export function fetchMemberCommentsQuery(
  queryClient: QueryClient,
  resourceId: number,
  screenCode = MEMBER_DETAIL_SCREEN_CODE,
  target: AdminCommentResourceTarget = 'member'
) {
  return queryClient.ensureQueryData(
    memberCommentsQueryOptions(resourceId, screenCode, target)
  )
}

export function useMemberCommentsQuery(
  resourceId: number | undefined,
  enabled = true,
  screenCode = MEMBER_DETAIL_SCREEN_CODE,
  target: AdminCommentResourceTarget = 'member',
  options?: MemberDetailSubresourceQueryOptions
) {
  const manualFetch = options?.manualFetch === true
  return useQuery({
    ...memberCommentsQueryOptions(resourceId ?? 0, screenCode, target),
    enabled: Boolean(enabled && resourceId != null && isMembersRemoteEnabled() && !manualFetch),
  })
}

export function affiliatedTeachersQueryOptions(params: {
  memberId?: number
  organizationId?: number
}) {
  const useOrgApi = params.organizationId != null
  return queryOptions({
    queryKey: useOrgApi
      ? memberQueryKeys.schoolTeachers(params.organizationId!)
      : memberQueryKeys.affiliatedTeachers(params.memberId ?? 0),
    staleTime: 30_000,
    queryFn: async (): Promise<SchoolAffiliatedTeacherRow[]> => {
      const rows = useOrgApi
        ? await fetchSchoolTeachersRemote(params.organizationId!)
        : await fetchAffiliatedTeachersRemote(params.memberId!)
      return mapAffiliatedTeacherRows(rows)
    },
    meta: {
      errorMessage: (error: unknown) =>
        getMemberApiErrorMessage(error, '소속 교사 목록을 불러오지 못했습니다.'),
    },
  })
}

/** 학교 소속 교사 — `organizationId` 우선, 없으면 legacy `memberId` affiliated-teachers */
export function fetchAffiliatedTeachersQuery(
  queryClient: QueryClient,
  params: { memberId?: number; organizationId?: number }
) {
  if (params.organizationId != null || params.memberId != null) {
    return queryClient.ensureQueryData(affiliatedTeachersQueryOptions(params))
  }
  return Promise.resolve([] as SchoolAffiliatedTeacherRow[])
}

/**
 * 학교 소속 교사 — `organizationId` 우선 (`listTeachers`),
 * 없으면 legacy `memberId` affiliated-teachers.
 *
 * Class C 목록 — staleTime 30s. 탭 전환 시 불필요한 재GET을 줄인다.
 */
export function useAffiliatedTeachersQuery(
  memberId: number | undefined,
  enabled = true,
  organizationId?: number,
  options?: MemberDetailSubresourceQueryOptions
) {
  const useOrgApi = organizationId != null
  const canUse = Boolean(
    isMembersRemoteEnabled() && (useOrgApi || memberId != null)
  )
  return useQuery({
    ...affiliatedTeachersQueryOptions({ memberId, organizationId }),
    enabled: options?.manualFetch ? false : Boolean(enabled && canUse),
  })
}

export function useMemberApplicationsQuery(
  memberId: number | undefined,
  userId: string | undefined,
  enabled = true,
  options?: MemberDetailSubresourceQueryOptions
) {
  const canUse = Boolean(memberId != null && userId && isMembersRemoteEnabled())
  return useQuery({
    ...memberApplicationsQueryOptions(memberId ?? 0, userId ?? ''),
    enabled: options?.manualFetch ? false : Boolean(enabled && canUse),
  })
}

export function useMemberProgramHistoryQuery(
  memberId: number | undefined,
  userId: string | undefined,
  enabled = true,
  options?: MemberDetailSubresourceQueryOptions
) {
  const canUse = Boolean(memberId != null && userId && isMembersRemoteEnabled())
  return useQuery({
    ...memberProgramHistoryQueryOptions(memberId ?? 0, userId ?? ''),
    enabled: options?.manualFetch ? false : Boolean(enabled && canUse),
  })
}

/**
 * 학교 organization — 프로젝트 수강 이력 (전용 API, member applications 미사용).
 */
export function useSchoolOrganizationProgramEnrollmentHistoryQuery(
  organizationId: number | undefined,
  organizationUserId: string | undefined,
  enabled = true,
  params?: ListSchoolOrganizationProgramEnrollmentHistoryParams,
  options?: MemberDetailSubresourceQueryOptions
) {
  const membersRemote = isMembersRemoteEnabled()
  const canUse = Boolean(
    organizationUserId && (membersRemote ? organizationId != null : true)
  )
  return useQuery({
    ...schoolOrganizationProgramEnrollmentHistoryQueryOptions(
      organizationId ?? 0,
      organizationUserId ?? '',
      params
    ),
    enabled: options?.manualFetch ? false : Boolean(enabled && canUse),
  })
}

export type AdminManagedProgramsQueryScope = {
  memberId?: number
  adminAccountId?: number
}

export function useMemberAdminProgramsQuery(
  scope: AdminManagedProgramsQueryScope,
  enabled = true
) {
  const { memberId, adminAccountId } = scope
  const useAdminAccountPath = adminAccountId != null && adminAccountId > 0

  return useQuery({
    queryKey: useAdminAccountPath
      ? memberQueryKeys.adminAccountPrograms(adminAccountId!)
      : memberQueryKeys.adminPrograms(memberId ?? 0),
    staleTime: MEMBER_DETAIL_SUBRESOURCE_STALE_MS,
    enabled: Boolean(
      enabled &&
        isMembersRemoteEnabled() &&
        (useAdminAccountPath || (memberId != null && memberId > 0))
    ),
    queryFn: async (): Promise<Program[]> => {
      if (useAdminAccountPath) {
        const res = await fetchAdminAccountProgramRolesRemote(adminAccountId!, {
          page: 0,
          size: MEMBER_DETAIL_LIST_SIZE,
        })
        return mapMemberAdminPrograms(res.items)
      }
      const res = await fetchMemberAdminProgramsRemote(memberId!, {
        page: 0,
        size: MEMBER_DETAIL_LIST_SIZE,
      })
      return mapMemberAdminPrograms(res.items)
    },
    meta: {
      errorMessage: (error: unknown) =>
        getMemberApiErrorMessage(error, '관리자 담당 프로그램 이력을 불러오지 못했습니다.'),
    },
  })
}

export { filterApplicationsBySubjectType }
