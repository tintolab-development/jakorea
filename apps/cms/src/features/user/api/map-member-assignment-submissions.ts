import dayjs from 'dayjs'
import type { MemberAssignmentSubmissionResponse } from '@/shared/api/generated/members/schemas/memberAssignmentSubmissionResponse'
import type {
  AssignmentSubmissionDetail,
  AssignmentSubmissionRowStatusKey,
  AssignmentSubmissionTableRow,
  LectureProgressDisplayKey,
} from '@/features/program/general/model/school-detail-types'

function mapSubmissionStatus(raw?: string): AssignmentSubmissionRowStatusKey {
  const v = raw?.trim().toUpperCase()
  if (v === 'SUBMITTED' || v === 'APPROVED' || v === 'COMPLETED') return 'submitted'
  if (v === 'REJECTED') return 'rejected'
  return 'not_submitted'
}

function mapLectureProgress(raw?: string): LectureProgressDisplayKey {
  const v = raw?.trim().toUpperCase()
  if (v === 'COMPLETED' || v === 'SUBMITTED' || v === 'APPROVED') return 'completed'
  return 'scheduled'
}

function formatSubmittedAt(value?: string): string {
  if (!value?.trim()) return '-'
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format('YYYY. MM. DD (ddd)') : value
}

export function mapMemberAssignmentSubmissionsToDetail(
  submissions: MemberAssignmentSubmissionResponse[],
  programTitle: string,
  studentName: string
): AssignmentSubmissionDetail {
  const rows: AssignmentSubmissionTableRow[] = submissions.map((item, index) => ({
    id: String(item.submissionId ?? index + 1),
    roundNumber: index + 1,
    teamRole: 'individual',
    teamName: '-',
    educationDateLabel: formatSubmittedAt(item.submittedAt),
    assignmentPeriodLabel: '-',
    lectureProgress: mapLectureProgress(item.responseStatus),
    submissionStatus: mapSubmissionStatus(item.responseStatus),
    canViewAssignment: (item.fileCount ?? 0) > 0,
  }))

  return {
    programTitle: programTitle.trim() || '프로그램',
    studentName: studentName.trim() || '-',
    rows,
  }
}
