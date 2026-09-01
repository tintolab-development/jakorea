import type { MemberApplicationHistoryResponse } from '@/shared/api/generated/members/schemas/memberApplicationHistoryResponse'
import type {
  Application,
  ApplicationRejectionKind,
  ApplicationStatus,
  ApplicationSubjectType,
} from '@/types/domain'
import type { ApplicationProgressStatus } from '@/types/application-progress'

function mapApplicationSubjectType(raw?: string): ApplicationSubjectType {
  const v = raw?.trim().toUpperCase()
  if (v === 'SCHOOL' || v === 'INSTITUTION' || v === 'ORGANIZATION') return 'school'
  if (v === 'INSTRUCTOR') return 'instructor'
  if (v === 'VOLUNTEER') return 'volunteer'
  return 'student'
}

function mapApplicationStatus(raw?: string): ApplicationStatus {
  const v = raw?.trim().toUpperCase()
  if (v === 'APPROVED') return 'approved'
  if (v === 'REJECTED' || v === 'AUTO_REJECTED') return 'rejected'
  if (v === 'WAITING_REVIEW' || v === 'DOCUMENT_PASS') return 'reviewing'
  if (v === 'WAITING_ASSIGNMENT' || v === 'ASSIGNED') return 'approved'
  return 'submitted'
}

function mapRejectionKind(
  applicationStatus?: string,
  interviewStatus?: string
): ApplicationRejectionKind | undefined {
  const interview = interviewStatus?.trim().toUpperCase()
  if (interview === 'FAILED' || interview === 'REJECTED') return 'INTERVIEW'
  const status = applicationStatus?.trim().toUpperCase()
  if (status === 'REJECTED' || status === 'AUTO_REJECTED') return 'APPLICATION'
  return undefined
}

function mapProgressStatus(
  finalResultStatus?: string,
  applicationStatus?: string
): ApplicationProgressStatus | undefined {
  const result = finalResultStatus?.trim().toUpperCase()
  if (result === 'IN_PROGRESS' || result === 'EDUCATION_IN_PROGRESS') return 'IN_PROGRESS'
  if (result === 'REPORT_SUBMITTED' || result === 'PROGRAM_ENDED') return 'REPORT_SUBMITTED'
  if (result === 'RECEIVED' || result === 'EDUCATION_SCHEDULED') return 'RECEIVED'
  const status = applicationStatus?.trim().toUpperCase()
  if (status === 'ASSIGNED' || status === 'APPROVED') return 'RECEIVED'
  return undefined
}

export function mapMemberApplicationHistoryItem(
  item: MemberApplicationHistoryResponse,
  subjectId: string
): Application {
  const now = new Date().toISOString()
  const applicationId = item.applicationId
  const programId = item.programId != null ? String(item.programId) : 'unknown'
  const id =
    applicationId != null ? `app-${applicationId}` : `app-${programId}-${item.submittedAt ?? now}`

  return {
    id,
    programId,
    subjectType: mapApplicationSubjectType(item.applicationType),
    subjectId,
    status: mapApplicationStatus(item.applicationStatus ?? item.finalResultStatus),
    rejectionKind: mapRejectionKind(item.applicationStatus, item.interviewStatus),
    rejectionReason: item.rejectReason?.trim() || undefined,
    progressStatus: mapProgressStatus(item.finalResultStatus, item.applicationStatus),
    submittedAt: item.submittedAt ?? now,
    reviewedAt: item.approvedAt ?? item.rejectedAt ?? undefined,
    createdAt: item.submittedAt ?? now,
    updatedAt: item.approvedAt ?? item.rejectedAt ?? item.submittedAt ?? now,
    customFields: {
      ...(item.programName?.trim() ? { programName: item.programName.trim() } : {}),
      ...(applicationId != null ? { memberApplicationId: applicationId } : {}),
    },
  }
}

export function mapMemberApplicationHistoryItems(
  items: MemberApplicationHistoryResponse[] | undefined,
  subjectId: string
): Application[] {
  if (!items?.length) return []
  return items.map(item => mapMemberApplicationHistoryItem(item, subjectId))
}

export function filterApplicationsBySubjectType(
  applications: Application[],
  subjectType: ApplicationSubjectType
): Application[] {
  return applications.filter(app => app.subjectType === subjectType)
}
