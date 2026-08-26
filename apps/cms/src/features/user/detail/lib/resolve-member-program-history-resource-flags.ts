import type { QueryClient } from '@tanstack/react-query'
import type { InstructorMemberProfile } from '@/types/user'
import {
  fetchMemberApplicationsQuery,
  fetchMemberProgramHistoryQuery,
} from '@/features/user/api/hooks/use-member-detail-subresource-queries'
import {
  clampProgramsChildForUser,
  programsHistoryHasChildMenu,
  type UserDetailProgramsChildKey,
  type UserDetailUrlSyncUser,
} from './user-detail-fullpage-helpers'

/** programs API · program-history API 각각 enable 여부 (history LNB + 하위 child 기준) */
export function resolveMemberProgramHistoryResourceFlags(params: {
  historyTabActive: boolean
  programsChild: UserDetailProgramsChildKey
  hasProgramsChildMenu: boolean
  instructorMemberProfile?: InstructorMemberProfile
}): { loadApplications: boolean; loadProgramHistory: boolean } {
  const { historyTabActive, programsChild, hasProgramsChildMenu, instructorMemberProfile } = params
  if (!historyTabActive) {
    return { loadApplications: false, loadProgramHistory: false }
  }

  /** 하위 탭 없음 — 수강 테이블 + 봉사 이력 동시 노출 */
  if (!hasProgramsChildMenu) {
    return { loadApplications: true, loadProgramHistory: true }
  }

  switch (programsChild) {
    case 'enrollment':
      return { loadApplications: true, loadProgramHistory: false }
    case 'lecture':
      if (instructorMemberProfile === 'school_teacher') {
        return { loadApplications: false, loadProgramHistory: false }
      }
      return { loadApplications: true, loadProgramHistory: false }
    case 'volunteer':
      return { loadApplications: false, loadProgramHistory: true }
    default:
      return { loadApplications: false, loadProgramHistory: false }
  }
}

export function resolveActiveProgramHistoryTabLoading(params: {
  programsChild: UserDetailProgramsChildKey
  hasProgramsChildMenu: boolean
  enrollmentTabLoading: boolean
  lectureTabLoading: boolean
  volunteerTabLoading: boolean
}): boolean {
  const {
    programsChild,
    hasProgramsChildMenu,
    enrollmentTabLoading,
    lectureTabLoading,
    volunteerTabLoading,
  } = params
  if (!hasProgramsChildMenu) {
    return enrollmentTabLoading || volunteerTabLoading
  }
  switch (programsChild) {
    case 'enrollment':
      return enrollmentTabLoading
    case 'lecture':
      return lectureTabLoading
    case 'volunteer':
      return volunteerTabLoading
    default:
      return false
  }
}

/** history LNB·하위 child 진입 시 해당 탭 API를 fetchQuery로 1회만 호출 */
export async function fetchMemberProgramHistoryTabResources(
  queryClient: QueryClient,
  params: {
    memberId: number | undefined
    userId: string | undefined
    historyTabActive: boolean
    programsChild: UserDetailProgramsChildKey
    hasProgramsChildMenu: boolean
    instructorMemberProfile?: InstructorMemberProfile
  }
): Promise<void> {
  const {
    memberId,
    userId,
    historyTabActive,
    programsChild,
    hasProgramsChildMenu,
    instructorMemberProfile,
  } = params
  if (!historyTabActive || memberId == null || !userId) return

  const { loadApplications, loadProgramHistory } = resolveMemberProgramHistoryResourceFlags({
    historyTabActive,
    programsChild,
    hasProgramsChildMenu,
    instructorMemberProfile,
  })

  const tasks: Promise<unknown>[] = []
  if (loadApplications) {
    tasks.push(fetchMemberApplicationsQuery(queryClient, memberId, userId))
  }
  if (loadProgramHistory) {
    tasks.push(fetchMemberProgramHistoryQuery(queryClient, memberId, userId))
  }
  await Promise.all(tasks)
}

/** @deprecated fetchMemberProgramHistoryTabResources 사용 */
export const refetchMemberProgramHistoryTabResources = fetchMemberProgramHistoryTabResources

export function resolveProgramsChildForMemberDetail(
  displayUser: UserDetailUrlSyncUser | null,
  tabLnb: string,
  tabChild: UserDetailProgramsChildKey | undefined
): UserDetailProgramsChildKey {
  if (!displayUser || tabLnb !== 'history') return 'enrollment'
  if (!programsHistoryHasChildMenu(displayUser)) return 'enrollment'
  return clampProgramsChildForUser(displayUser, tabChild ?? 'enrollment')
}
