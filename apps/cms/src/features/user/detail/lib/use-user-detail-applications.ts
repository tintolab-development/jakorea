import { useState, useEffect, useCallback } from 'react'
import { applicationService } from '@/entities/application/api/application-service'
import type { Application, ApplicationSubjectType } from '@/types/domain'
import type { User } from '@/types/user'
import {
  fetchMemberApplicationsRemote,
  fetchMemberProgramHistoryRemote,
} from '@/features/user/api/members-api-client'
import {
  filterApplicationsBySubjectType,
  mapMemberApplicationHistoryItems,
} from '@/features/user/api/map-member-application-history'
import { mapMemberProgramHistoryToEnrollmentApplications } from '@/features/user/api/map-member-program-history'
import { getMemberApiErrorMessage } from '@/features/user/api/get-member-api-error'
import { isMembersRemoteEnabled } from '@/features/user/api/member-remote-capabilities'
import { resolveMemberIdForApi } from '@/features/user/api/member-id-registry'

export type UserDetailDisplayUser = Omit<User, 'password'>

const MEMBER_DETAIL_LIST_SIZE = 200

function splitApplicationsForRole(
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

async function loadApplicationsRemote(
  displayUser: UserDetailDisplayUser
): Promise<{ applications: Application[]; enrollmentApplications: Application[] }> {
  const memberId = resolveMemberIdForApi(displayUser.id)
  const [applicationsRes, historyRes] = await Promise.all([
    fetchMemberApplicationsRemote(memberId, { page: 0, size: MEMBER_DETAIL_LIST_SIZE }),
    fetchMemberProgramHistoryRemote(memberId, { page: 0, size: MEMBER_DETAIL_LIST_SIZE }),
  ])

  const fromApplications = mapMemberApplicationHistoryItems(
    applicationsRes.items,
    displayUser.id
  )
  const fromHistory = mapMemberProgramHistoryToEnrollmentApplications(
    historyRes.items,
    displayUser.id
  )

  const mergedById = new Map<string, Application>()
  for (const app of [...fromApplications, ...fromHistory]) {
    mergedById.set(app.id, app)
  }

  return splitApplicationsForRole([...mergedById.values()], displayUser.role)
}

export async function loadApplicationsForUser(
  displayUser: UserDetailDisplayUser
): Promise<{ applications: Application[]; enrollmentApplications: Application[] }> {
  if (isMembersRemoteEnabled()) {
    return loadApplicationsRemote(displayUser)
  }

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
  let subjectType: ApplicationSubjectType | undefined
  if (displayUser.role === 'SCHOOL') subjectType = 'school'
  const userApplications = await applicationService.getByUserId(displayUser.id, subjectType)
  return { applications: userApplications, enrollmentApplications: [] }
}

export function useUserDetailApplications(
  open: boolean,
  displayUser: UserDetailDisplayUser | null | undefined
) {
  const [applications, setApplications] = useState<Application[]>([])
  const [enrollmentApplications, setEnrollmentApplications] = useState<Application[]>([])
  const [applicationsLoading, setApplicationsLoading] = useState(false)

  const refetchApplications = useCallback(async () => {
    if (!displayUser) return
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
  }, [displayUser])

  useEffect(() => {
    if (open && displayUser) {
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
  }, [open, displayUser])

  return {
    applications,
    enrollmentApplications,
    applicationsLoading,
    refetchApplications,
  }
}
