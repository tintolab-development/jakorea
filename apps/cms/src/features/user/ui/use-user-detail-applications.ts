import { useState, useEffect, useCallback } from 'react'
import { applicationService } from '@/entities/application/api/application-service'
import type { Application } from '@/types/domain'
import type { User } from '@/types/user'

export type UserDetailDisplayUser = Omit<User, 'password'>

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
  let subjectType: Application['subjectType'] | undefined
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
          console.error('Failed to load applications:', error)
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
