import { useQuery } from '@tanstack/react-query'
import { memberQueryKeys } from '@/features/user/api/member-query-keys'
import {
  fetchAffiliatedTeachersRemote,
  fetchMemberAdminProgramsRemote,
  fetchMemberApplicationsRemote,
  fetchMemberCommentsRemote,
  fetchMemberProgramHistoryRemote,
} from '@/features/user/api/members-api-client'
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
} from '@/features/user/api/map-member-comments'
import { getMemberApiErrorMessage } from '@/features/user/api/get-member-api-error'
import { isMembersRemoteEnabled } from '@/features/user/api/member-remote-capabilities'
import type { Application } from '@/types/domain'
import type { UserHistory } from '@/types/domain'
import type { Program } from '@/types/domain'
import type { SchoolAffiliatedTeacherRow } from '@/types/user'

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
      }
    },
    meta: {
      errorMessage: (error: unknown) =>
        getMemberApiErrorMessage(error, '관리자 코멘트를 불러오지 못했습니다.'),
    },
  })
}

export function useAffiliatedTeachersQuery(memberId: number | undefined, enabled = true) {
  return useQuery({
    queryKey: memberQueryKeys.affiliatedTeachers(memberId ?? 0),
    enabled: Boolean(enabled && memberId != null && isMembersRemoteEnabled()),
    queryFn: async (): Promise<SchoolAffiliatedTeacherRow[]> => {
      const rows = await fetchAffiliatedTeachersRemote(memberId!)
      return mapAffiliatedTeacherRows(rows)
    },
    meta: {
      errorMessage: (error: unknown) =>
        getMemberApiErrorMessage(error, '소속 교사 목록을 불러오지 못했습니다.'),
    },
  })
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
      return mapMemberApplicationHistoryItems(res.items, userId!)
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

export function useMemberAdminProgramsQuery(memberId: number | undefined, enabled = true) {
  return useQuery({
    queryKey: memberQueryKeys.adminPrograms(memberId ?? 0),
    enabled: Boolean(enabled && memberId != null && isMembersRemoteEnabled()),
    queryFn: async (): Promise<Program[]> => {
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
