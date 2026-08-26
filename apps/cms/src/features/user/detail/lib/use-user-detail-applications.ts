import { useState, useEffect, useCallback, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { applicationService } from '@/entities/application/api/application-service'
import type { Application } from '@/types/domain'
import type { UserHistory } from '@/types/domain'
import type { User } from '@/types/user'
import {
  useMemberApplicationsQuery,
  useMemberProgramHistoryQuery,
} from '@/features/user/api/hooks/use-member-detail-subresource-queries'
import { filterApplicationsBySubjectType } from '@/features/user/api/map-member-application-history'
import { getMemberApiErrorMessage } from '@/features/user/api/get-member-api-error'
import { isMembersRemoteEnabled } from '@/features/user/api/member-remote-capabilities'
import { resolveMemberIdForApi } from '@/features/user/api/member-id-registry'
import { resolveInstructorMemberProfile } from '@/entities/user/lib/resolve-instructor-member-profile'
import type { UserDetailProgramsChildKey } from './user-detail-fullpage-helpers'
import {
  fetchMemberProgramHistoryTabResources,
  resolveMemberProgramHistoryResourceFlags,
} from './resolve-member-program-history-resource-flags'

function isManualSubresourceQueryLoading(query: {
  isPending: boolean
  isFetching: boolean
}): boolean {
  return query.isPending || query.isFetching
}

export type UserDetailDisplayUser = Omit<User, 'password'>

export function splitApplicationsForRole(
  all: Application[],
  role: User['role']
): { applications: Application[]; enrollmentApplications: Application[] } {
  if (role === 'INSTRUCTOR') {
    return {
      applications: filterApplicationsBySubjectType(all, 'instructor'),
      enrollmentApplications: filterApplicationsBySubjectType(all, 'student'),
    }
  }
  if (role === 'INDIVIDUAL') {
    return {
      applications: filterApplicationsBySubjectType(all, 'student'),
      enrollmentApplications: [],
    }
  }
  if (role === 'SCHOOL') {
    return {
      applications: filterApplicationsBySubjectType(all, 'school'),
      enrollmentApplications: [],
    }
  }
  return { applications: all, enrollmentApplications: [] }
}

export function mergeMemberApplicationsWithProgramHistory(
  fromApplications: Application[],
  fromHistory: Application[],
  role: User['role']
): { applications: Application[]; enrollmentApplications: Application[] } {
  const mergedById = new Map<string, Application>()
  for (const app of [...fromApplications, ...fromHistory]) {
    mergedById.set(app.id, app)
  }
  return splitApplicationsForRole([...mergedById.values()], role)
}

function tryResolveMemberId(user: UserDetailDisplayUser | null | undefined): number | undefined {
  if (!user) return undefined
  try {
    return resolveMemberIdForApi(user.id, { memberId: user.memberId })
  } catch {
    return user.memberId
  }
}

async function loadMockApplicationsForProgramsChild(
  displayUser: UserDetailDisplayUser,
  programsChild: UserDetailProgramsChildKey
): Promise<{ applications: Application[]; enrollmentApplications: Application[] }> {
  if (displayUser.role === 'INSTRUCTOR') {
    if (programsChild === 'lecture') {
      const instructorApps = await applicationService.getByUserId(displayUser.id, 'instructor')
      return { applications: instructorApps, enrollmentApplications: [] }
    }
    if (programsChild === 'enrollment') {
      const studentApps = await applicationService.getByUserId(displayUser.id, 'student')
      return { applications: [], enrollmentApplications: studentApps }
    }
    return { applications: [], enrollmentApplications: [] }
  }
  if (displayUser.role === 'INDIVIDUAL') {
    if (programsChild === 'enrollment') {
      const studentApps = await applicationService.getByUserId(displayUser.id, 'student')
      return { applications: studentApps, enrollmentApplications: [] }
    }
    return { applications: [], enrollmentApplications: [] }
  }
  if (displayUser.role === 'SCHOOL') {
    return { applications: [], enrollmentApplications: [] }
  }
  return { applications: [], enrollmentApplications: [] }
}

export function useUserDetailApplications(
  open: boolean,
  displayUser: UserDetailDisplayUser | null | undefined,
  options?: {
    /** history LNB 활성 */
    enabled?: boolean
    programsChild?: UserDetailProgramsChildKey
    hasProgramsChildMenu?: boolean
  }
) {
  const historyTabActive = options?.enabled !== false
  const programsChild = options?.programsChild ?? 'enrollment'
  const hasProgramsChildMenu = options?.hasProgramsChildMenu ?? false
  const membersRemote = isMembersRemoteEnabled()
  const queryClient = useQueryClient()
  const memberId = tryResolveMemberId(displayUser)
  const queryEnabled = Boolean(open && historyTabActive && displayUser)
  const instructorMemberProfile =
    displayUser?.role === 'INSTRUCTOR'
      ? (resolveInstructorMemberProfile(displayUser) ?? undefined)
      : undefined

  const { loadApplications, loadProgramHistory } = useMemo(
    () =>
      resolveMemberProgramHistoryResourceFlags({
        historyTabActive: queryEnabled,
        programsChild,
        hasProgramsChildMenu,
        instructorMemberProfile,
      }),
    [queryEnabled, programsChild, hasProgramsChildMenu, instructorMemberProfile]
  )

  const applicationsQuery = useMemberApplicationsQuery(
    memberId,
    displayUser?.id,
    queryEnabled && loadApplications,
    { manualFetch: membersRemote }
  )
  const programHistoryQuery = useMemberProgramHistoryQuery(
    memberId,
    displayUser?.id,
    queryEnabled && loadProgramHistory,
    { manualFetch: membersRemote }
  )

  const tabResourceFetchKey = queryEnabled
    ? `${memberId ?? ''}:${displayUser?.id ?? ''}:${programsChild}:${loadApplications}:${loadProgramHistory}`
    : ''

  useEffect(() => {
    if (!membersRemote || !tabResourceFetchKey || memberId == null || !displayUser?.id) return

    void fetchMemberProgramHistoryTabResources(queryClient, {
      memberId,
      userId: displayUser.id,
      historyTabActive: true,
      programsChild,
      hasProgramsChildMenu,
      instructorMemberProfile,
    })
  }, [
    membersRemote,
    tabResourceFetchKey,
    memberId,
    displayUser?.id,
    programsChild,
    hasProgramsChildMenu,
    instructorMemberProfile,
    queryClient,
  ])

  const remoteMerged = useMemo(() => {
    if (!membersRemote || !displayUser) {
      return { applications: [] as Application[], enrollmentApplications: [] as Application[] }
    }
    return mergeMemberApplicationsWithProgramHistory(
      applicationsQuery.data ?? [],
      programHistoryQuery.data?.enrollmentFromHistory ?? [],
      displayUser.role
    )
  }, [membersRemote, displayUser, applicationsQuery.data, programHistoryQuery.data])

  const remoteVolunteerHistories = programHistoryQuery.data?.volunteerHistories ?? []

  const enrollmentTabLoading = Boolean(
    queryEnabled &&
      membersRemote &&
      loadApplications &&
      isManualSubresourceQueryLoading(applicationsQuery)
  )

  const lectureTabLoading = Boolean(
    queryEnabled &&
      membersRemote &&
      loadApplications &&
      isManualSubresourceQueryLoading(applicationsQuery)
  )

  const volunteerTabLoading = Boolean(
    queryEnabled &&
      membersRemote &&
      loadProgramHistory &&
      isManualSubresourceQueryLoading(programHistoryQuery)
  )

  const [applications, setApplications] = useState<Application[]>([])
  const [enrollmentApplications, setEnrollmentApplications] = useState<Application[]>([])
  const [applicationsLoading, setApplicationsLoading] = useState(false)

  const refetchApplications = useCallback(async () => {
    if (!displayUser || !historyTabActive) return
    if (membersRemote) {
      if (memberId == null) return
      await fetchMemberProgramHistoryTabResources(queryClient, {
        memberId,
        userId: displayUser.id,
        historyTabActive: true,
        programsChild,
        hasProgramsChildMenu,
        instructorMemberProfile,
      })
      return
    }
    try {
      const { applications: nextApps, enrollmentApplications: nextEnrollment } =
        await loadMockApplicationsForProgramsChild(displayUser, programsChild)
      setApplications(nextApps)
      setEnrollmentApplications(nextEnrollment)
    } catch (error) {
      console.error('Failed to load applications:', error)
    }
  }, [displayUser, historyTabActive, memberId, membersRemote, programsChild, hasProgramsChildMenu, instructorMemberProfile, queryClient])

  const mockLoadKey = displayUser
    ? `${displayUser.id}:${displayUser.memberId ?? ''}:${displayUser.role}:${programsChild}:${loadApplications}`
    : ''

  useEffect(() => {
    if (membersRemote) return

    if (open && displayUser && historyTabActive && loadApplications) {
      const run = async () => {
        setApplicationsLoading(true)
        try {
          const { applications: nextApps, enrollmentApplications: nextEnrollment } =
            await loadMockApplicationsForProgramsChild(displayUser, programsChild)
          setApplications(nextApps)
          setEnrollmentApplications(nextEnrollment)
        } catch (error) {
          console.error(
            getMemberApiErrorMessage(error, 'Failed to load applications:'),
            error
          )
        } finally {
          setApplicationsLoading(false)
        }
      }
      void run()
    }
  }, [open, mockLoadKey, historyTabActive, loadApplications, membersRemote, displayUser, programsChild])

  useEffect(() => {
    if (membersRemote || open) return
    setApplications([])
    setEnrollmentApplications([])
  }, [membersRemote, open])

  if (membersRemote) {
    return {
      applications: remoteMerged.applications,
      enrollmentApplications: remoteMerged.enrollmentApplications,
      applicationsLoading: enrollmentTabLoading || lectureTabLoading,
      volunteerHistories: remoteVolunteerHistories,
      volunteerHistoriesLoading: volunteerTabLoading,
      enrollmentTabLoading,
      lectureTabLoading,
      volunteerTabLoading,
      refetchApplications,
    }
  }

  const mockMerged = useMemo(() => {
    if (!displayUser) {
      return { applications: [] as Application[], enrollmentApplications: [] as Application[] }
    }
    return splitApplicationsForRole(
      [...applications, ...enrollmentApplications],
      displayUser.role
    )
  }, [applications, enrollmentApplications, displayUser])

  return {
    applications: mockMerged.applications,
    enrollmentApplications: mockMerged.enrollmentApplications,
    applicationsLoading,
    volunteerHistories: [] as UserHistory[],
    volunteerHistoriesLoading: false,
    enrollmentTabLoading: applicationsLoading,
    lectureTabLoading: applicationsLoading,
    volunteerTabLoading: false,
    refetchApplications,
  }
}
