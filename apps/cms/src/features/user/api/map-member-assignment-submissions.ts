import dayjs from 'dayjs'
import type { MemberAssignmentSubmissionResponse } from '@/shared/api/generated/members/schemas/memberAssignmentSubmissionResponse'
import type {
  AssignmentSubmissionDetail,
  AssignmentSubmissionRowStatusKey,
  AssignmentSubmissionTableRow,
  AssignmentTeamRoleKey,
  LectureProgressDisplayKey,
} from '@/features/program/general/model/school-detail-types'

/** OpenAPI 미반영 확장 필드 — REQ-009 BE 스키마 확장 시 매핑 SSOT */
type MemberAssignmentSubmissionResponseExtended = MemberAssignmentSubmissionResponse & {
  roundNumber?: number
  teamRole?: string
  teamName?: string
  educationSessionLabel?: string
  assignmentPeriodStart?: string
  assignmentPeriodEnd?: string
  assignmentPeriodLabel?: string
  lectureProgress?: string
  submissionStatus?: string
  submissionFileIds?: number[]
}

function mapTeamRole(raw?: string): AssignmentTeamRoleKey {
  const v = raw?.trim().toUpperCase()
  if (v === 'LEADER') return 'leader'
  if (v === 'MEMBER') return 'member'
  return 'individual'
}

function mapSubmissionStatus(raw?: string): AssignmentSubmissionRowStatusKey {
  const v = raw?.trim().toUpperCase()
  if (v === 'SUBMITTED' || v === 'APPROVED' || v === 'COMPLETED') return 'submitted'
  if (v === 'SCHEDULED' || v === 'PENDING') return 'scheduled'
  if (v === 'NONE') return 'none'
  return 'not_submitted'
}

function mapLectureProgress(raw?: string): LectureProgressDisplayKey {
  const v = raw?.trim().toUpperCase()
  if (v === 'COMPLETED' || v === 'DONE') return 'completed'
  return 'scheduled'
}

function formatSubmittedAt(value?: string): string {
  if (!value?.trim()) return '-'
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format('YYYY. MM. DD (ddd)') : value
}

function formatPeriodLabel(start?: string, end?: string, label?: string): string {
  if (label?.trim()) return label.trim()
  const startLabel = formatSubmittedAt(start)
  const endLabel = formatSubmittedAt(end)
  if (startLabel !== '-' && endLabel !== '-') return `${startLabel} ~ ${endLabel}`
  if (startLabel !== '-') return startLabel
  if (endLabel !== '-') return endLabel
  return '-'
}

export function mapMemberAssignmentSubmissionsToDetail(
  submissions: MemberAssignmentSubmissionResponse[],
  programTitle: string,
  studentName: string
): AssignmentSubmissionDetail {
  const rows: AssignmentSubmissionTableRow[] = submissions.map((item, index) => {
    const extended = item as MemberAssignmentSubmissionResponseExtended
    const submissionFileIds = extended.submissionFileIds?.filter(
      (id): id is number => typeof id === 'number' && Number.isFinite(id)
    )
    const canViewFromFiles = (submissionFileIds?.length ?? 0) > 0
    const canViewFromCount = (item.fileCount ?? 0) > 0

    return {
      id: String(item.submissionId ?? index + 1),
      roundNumber: extended.roundNumber ?? index + 1,
      teamRole: mapTeamRole(extended.teamRole),
      teamName: extended.teamName?.trim() || '-',
      educationDateLabel:
        extended.educationSessionLabel?.trim() || formatSubmittedAt(item.submittedAt),
      assignmentPeriodLabel: formatPeriodLabel(
        extended.assignmentPeriodStart,
        extended.assignmentPeriodEnd,
        extended.assignmentPeriodLabel
      ),
      lectureProgress: extended.lectureProgress
        ? mapLectureProgress(extended.lectureProgress)
        : mapLectureProgress(item.responseStatus),
      submissionStatus: extended.submissionStatus
        ? mapSubmissionStatus(extended.submissionStatus)
        : mapSubmissionStatus(item.responseStatus),
      canViewAssignment: canViewFromFiles || canViewFromCount,
      submissionFileIds,
    }
  })

  return {
    programTitle: programTitle.trim() || '프로그램',
    studentName: studentName.trim() || '-',
    rows,
  }
}
