import {
  parseMemberProgramHistoryRowId,
  resolveMemberApplicationIdFromApplication,
} from '@/features/user/api/member-program-history-ids'
import { applyEnrollmentSummaryToApplication } from '@/features/user/api/map-member-enrollment-summary'
import { fetchApplicationEnrollmentSummaryRemote } from '@/features/user/api/members-api-client'
import type { Application } from '@/types/domain'

async function enrichSingleApplication(
  memberId: number,
  application: Application
): Promise<Application> {
  const applicationId = resolveMemberApplicationIdFromApplication(application)
  if (applicationId == null) return application
  if (parseMemberProgramHistoryRowId(application.id)?.kind !== 'application') {
    return application
  }
  try {
    const summary = await fetchApplicationEnrollmentSummaryRemote(memberId, applicationId)
    return applyEnrollmentSummaryToApplication(application, summary)
  } catch {
    return application
  }
}

/** applications 목록 API에 없는 출석·과제·담당자 필드를 enrollment-summary로 보강 */
export async function enrichMemberApplicationsWithEnrollmentSummaries(
  memberId: number,
  applications: Application[]
): Promise<Application[]> {
  if (applications.length === 0) return applications
  return Promise.all(applications.map(app => enrichSingleApplication(memberId, app)))
}
