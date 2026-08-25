import { useState, useEffect, useCallback, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { applicationService } from '@/entities/application/api/application-service'
import type { Application, ApplicationSubjectType } from '@/types/domain'
import type { User } from '@/types/user'
import {
  useMemberApplicationsQuery,
  useMemberProgramHistoryQuery,
} from '@/features/user/api/hooks/use-member-detail-subresource-queries'
import { filterApplicationsBySubjectType } from '@/features/user/api/map-member-application-history'
import { getMemberApiErrorMessage } from '@/features/user/api/get-member-api-error'
import { isMembersRemoteEnabled } from '@/features/user/api/member-remote-capabilities'
import { memberQueryKeys } from '@/features/user/api/member-query-keys'
import { resolveMemberIdForApi } from '@/features/user/api/member-id-registry'

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

export async function loadApplicationsForUser(
  displayUser: UserDetailDisplayUser
): Promise<{ applications: Application[]; enrollmentApplications: Application[] }> {
  if (displayUser.role === 'INSTRUCTOR') {
    const [instructorApps, studentApps] = await Promise.all([
      applicationService.getByUserId(displayUser.id, 'instructor'),
      applicationService.getByUserId(displayUser.id, 'student'),
    ])
    return { applications: instructorApps, enrollmentApplications: studentApps }
  }
  if (displayUser.role === 'INDIVIDUAL') {
    const studentApps = await applicationService.getByUserId(displayUser.id, 'student')
    return { applications: studentApps, enrollmentApplications: [] }
  }
  if (displayUser.role === 'SCHOOL') {
    /** 학교 상세 — organization 전용 API만 사용 (mock 금지) */
    return { applications: [], enrollmentApplications: [] }
  }
}

export function useUserDetailApplications(
  open: boolean,
  displayUser: UserDetailDisplayUser | null | undefined,
  /** 권한 승인 상세 등 — 프로그램 이력 탭이 없으면 호출 생략 */
  options?: { enabled?: boolean }
) {
  const enabled = options?.enabled !== false
  const membersRemote = isMembersRemoteEnabled()
  const queryClient = useQueryClient()
  const memberId = tryResolveMemberId(displayUser)
  const queryEnabled = Boolean(open && enabled && displayUser)

  const applicationsQuery = useMemberApplicationsQuery(
    memberId,
    displayUser?.id,
    queryEnabled && membersRemote
  )
  const programHistoryQuery = useMemberProgramHistoryQuery(
    memberId,
    displayUser?.id,
    queryEnabled && membersRemote
  )

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

  const [applications, setApplications] = useState<Application[]>([])
  const [enrollmentApplications, setEnrollmentApplications] = useState<Application[]>([])
  const [applicationsLoading, setApplicationsLoading] = useState(false)

  const refetchApplications = useCallback(async () => {
    if (!displayUser || !enabled) return
    if (membersRemote) {
      if (memberId == null) return
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: memberQueryKeys.applications(memberId) }),
        queryClient.invalidateQueries({ queryKey: memberQueryKeys.programHistory(memberId) }),
      ])
      return
    }
    try {
      const { applications: nextApps, enrollmentApplications: nextEnrollment } =
        await loadApplicationsForUser(displayUser)
      setApplications(nextApps)
      setEnrollmentApplications(nextEnrollment)
    } catch (error) {
      console.error('Failed to load applications:', error)
      setApplications([])
      setEnrollmentApplications([])
    }
  }, [displayUser, enabled, memberId, membersRemote, queryClient])

  const applicationLoadKey = displayUser
    ? `${displayUser.id}:${displayUser.memberId ?? ''}:${displayUser.role}`
    : ''

  useEffect(() => {
    if (membersRemote) return

    if (open && displayUser && enabled) {
      const run = async () => {
        setApplicationsLoading(true)
        try {
          const { applications: nextApps, enrollmentApplications: nextEnrollment } =
            await loadApplicationsForUser(displayUser)
          setApplications(nextApps)
          setEnrollmentApplications(nextEnrollment)
        } catch (error) {
          console.error(
            getMemberApiErrorMessage(error, 'Failed to load applications:'),
            error
          )
          setApplications([])
          setEnrollmentApplications([])
        } finally {
          setApplicationsLoading(false)
        }
      }
      void run()
    } else {
      setApplications([])
      setEnrollmentApplications([])
    }
  }, [open, applicationLoadKey, enabled, membersRemote])

  if (membersRemote) {
    return {
      applications: remoteMerged.applications,
      enrollmentApplications: remoteMerged.enrollmentApplications,
      applicationsLoading: Boolean(
        queryEnabled && (applicationsQuery.isLoading || programHistoryQuery.isLoading)
      ),
      refetchApplications,
    }
  }

  return {
    applications,
    enrollmentApplications,
    applicationsLoading,
    refetchApplications,
  }
}
