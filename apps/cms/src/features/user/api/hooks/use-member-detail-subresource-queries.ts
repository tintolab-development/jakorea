import { useQuery, type QueryClient } from '@tanstack/react-query'
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
import { parseOrganizationIdFromUserId } from '@/features/user/api/map-school-organization-to-user'
import { mapMemberAdminPrograms } from '@/features/user/api/map-member-admin-program'
import {
  mapMemberApplicationHistoryItems,
  filterApplicationsBySubjectType,
} from '@/features/user/api/map-member-application-history'
import { enrichMemberApplicationsWithEnrollmentSummaries } from '@/features/user/api/enrich-member-applications-with-enrollment'
import {
  mapMemberProgramHistoryItems,
  mapMemberProgramHistoryToEnrollmentApplications,
} from '@/features/user/api/map-member-program-history'
import {
  MEMBER_DETAIL_SCREEN_CODE,
  resolveLatestMemberAdminComment,
  resolveLatestMemberAdminCommentDetail,
} from '@/features/user/api/map-member-comments'
import { getMemberApiErrorMessage } from '@/features/user/api/get-member-api-error'
import { isMembersRemoteEnabled } from '@/features/user/api/member-remote-capabilities'
import type { Application } from '@/types/domain'
import type { UserHistory } from '@/types/domain'
import type { Program } from '@/types/domain'
import type { SchoolAffiliatedTeacherRow, User } from '@/types/user'

const MEMBER_DETAIL_LIST_SIZE = 200

export function useMemberCommentsQuery(
  memberId: number | undefined,
  enabled = true,
  screenCode = MEMBER_DETAIL_SCREEN_CODE
) {
  return useQuery({
    queryKey: memberQueryKeys.comments(memberId ?? 0, screenCode),
    enabled: Boolean(enabled && memberId != null && isMembersRemoteEnabled()),
    queryFn: async () => {
      const comments = await fetchMemberCommentsRemote(memberId!, { screenCode })
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

/**
 * 학교 소속 교사 — `organizationId` 우선 (`listTeachers`),
 * 없으면 legacy `memberId` affiliated-teachers.
 *
 * Class C 목록 — staleTime 30s. 탭 전환 시 불필요한 재GET을 줄인다.
 */
export function useAffiliatedTeachersQuery(
  memberId: number | undefined,
  enabled = true,
  organizationId?: number
) {
  const useOrgApi = organizationId != null
  return useQuery({
    queryKey: useOrgApi
      ? memberQueryKeys.schoolTeachers(organizationId)
      : memberQueryKeys.affiliatedTeachers(memberId ?? 0),
    enabled: Boolean(
      enabled &&
        isMembersRemoteEnabled() &&
        (useOrgApi || memberId != null)
    ),
    staleTime: 30_000,
    queryFn: async (): Promise<SchoolAffiliatedTeacherRow[]> => {
      const rows = useOrgApi
        ? await fetchSchoolTeachersRemote(organizationId)
        : await fetchAffiliatedTeachersRemote(memberId!)
      return mapAffiliatedTeacherRows(rows)
    },
    meta: {
      errorMessage: (error: unknown) =>
        getMemberApiErrorMessage(error, '소속 교사 목록을 불러오지 못했습니다.'),
    },
  })
}

/** 학교 상세 GET 성공 직후 소속 교사 목록을 바로 요청(기본정보 탭 마운트 전에도 시작). */
export function prefetchSchoolAffiliatedTeachers(
  queryClient: QueryClient,
  user: Pick<User, 'role' | 'organizationId' | 'memberId' | 'id'>
): void {
  if (!isMembersRemoteEnabled() || user.role !== 'SCHOOL') return

  const organizationId =
    user.organizationId ?? parseOrganizationIdFromUserId(user.id) ?? undefined

  if (organizationId != null) {
    void queryClient.prefetchQuery({
      queryKey: memberQueryKeys.schoolTeachers(organizationId),
      staleTime: 30_000,
      queryFn: async (): Promise<SchoolAffiliatedTeacherRow[]> =>
        mapAffiliatedTeacherRows(await fetchSchoolTeachersRemote(organizationId)),
    })
    return
  }

  if (user.memberId != null) {
    void queryClient.prefetchQuery({
      queryKey: memberQueryKeys.affiliatedTeachers(user.memberId),
      staleTime: 30_000,
      queryFn: async (): Promise<SchoolAffiliatedTeacherRow[]> =>
        mapAffiliatedTeacherRows(await fetchAffiliatedTeachersRemote(user.memberId!)),
    })
  }
}

export function useMemberApplicationsQuery(
  memberId: number | undefined,
  userId: string | undefined,
  enabled = true
) {
  return useQuery({
    queryKey: memberQueryKeys.applications(memberId ?? 0),
    enabled: Boolean(
      enabled && memberId != null && userId && isMembersRemoteEnabled()
    ),
    queryFn: async (): Promise<Application[]> => {
      const res = await fetchMemberApplicationsRemote(memberId!, {
        page: 0,
        size: MEMBER_DETAIL_LIST_SIZE,
      })
      const mapped = mapMemberApplicationHistoryItems(res.items, userId!)
      return enrichMemberApplicationsWithEnrollmentSummaries(memberId!, mapped)
    },
    meta: {
      errorMessage: (error: unknown) =>
        getMemberApiErrorMessage(error, '프로그램 신청 이력을 불러오지 못했습니다.'),
    },
  })
}

export function useMemberProgramHistoryQuery(
  memberId: number | undefined,
  userId: string | undefined,
  enabled = true
) {
  return useQuery({
    queryKey: memberQueryKeys.programHistory(memberId ?? 0),
    enabled: Boolean(
      enabled && memberId != null && userId && isMembersRemoteEnabled()
    ),
    queryFn: async (): Promise<{
      volunteerHistories: UserHistory[]
      enrollmentFromHistory: Application[]
    }> => {
      const res = await fetchMemberProgramHistoryRemote(memberId!, {
        page: 0,
        size: MEMBER_DETAIL_LIST_SIZE,
      })
      const items = res.items ?? []
      return {
        volunteerHistories: mapMemberProgramHistoryItems(items, userId!),
        enrollmentFromHistory: mapMemberProgramHistoryToEnrollmentApplications(
          items,
          userId!
        ),
      }
    },
    meta: {
      errorMessage: (error: unknown) =>
        getMemberApiErrorMessage(error, '프로그램 참여 이력을 불러오지 못했습니다.'),
    },
  })
}

/**
 * 학교 organization — 프로젝트 수강 이력 (전용 API, member applications 미사용).
 */
export function useSchoolOrganizationProgramEnrollmentHistoryQuery(
  organizationId: number | undefined,
  organizationUserId: string | undefined,
  enabled = true,
  params?: ListSchoolOrganizationProgramEnrollmentHistoryParams
) {
  const filtersKey = JSON.stringify(params ?? {})
  const membersRemote = isMembersRemoteEnabled()
  return useQuery({
    queryKey: memberQueryKeys.schoolProgramEnrollmentHistory(
      organizationId ?? 0,
      filtersKey,
      membersRemote ? '' : (organizationUserId ?? '')
    ),
    enabled: Boolean(
      enabled &&
        organizationUserId &&
        (membersRemote ? organizationId != null : true)
    ),
    queryFn: async (): Promise<Application[]> => {
      if (!membersRemote) {
        return fetchSchoolOrganizationProgramEnrollmentHistoryMock(organizationUserId!)
      }
      const res = await fetchSchoolOrganizationProgramEnrollmentHistoryRemote(organizationId!, {
        page: 0,
        size: MEMBER_DETAIL_LIST_SIZE,
        ...params,
      })
      return mapSchoolOrganizationProgramEnrollmentHistoryItems(
        res.items,
        organizationUserId!
      )
    },
    meta: {
      errorMessage: (error: unknown) =>
        getMemberApiErrorMessage(error, '프로젝트 수강 이력을 불러오지 못했습니다.'),
    },
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
