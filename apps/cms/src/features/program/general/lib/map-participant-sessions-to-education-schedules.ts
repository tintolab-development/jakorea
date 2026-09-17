import type { ParticipatingInstructorEducationScheduleRow } from '@/features/program/general/model/participating-instructors'
import type { SessionProgress } from '@/shared/api/generated/dashboard/schemas/sessionProgress'

function mapSessionProgressStatus(
  raw?: string | null
): ParticipatingInstructorEducationScheduleRow['progress'] {
  const upper = raw?.trim().toUpperCase()
  if (upper === 'COMPLETED' || upper === 'DONE') return 'completed'
  if (upper === 'IN_PROGRESS' || upper === 'ONGOING') return 'in_progress'
  return 'scheduled'
}

function formatSessionProgressLabel(session: SessionProgress, index: number): string {
  const parts: string[] = []
  if (session.sessionNo != null) parts.push(`${session.sessionNo}차시`)
  if (session.scheduleName?.trim()) parts.push(session.scheduleName.trim())
  if (session.startAt?.trim()) {
    const date = session.startAt.slice(0, 10).replace(/-/g, '.')
    parts.push(date)
  }
  if (parts.length === 0) return `교육 일정 ${index + 1}`
  return parts.join(' · ')
}

/** participants `sessions[]` → 활동 포기 모달 일정 선택지 */
export function mapParticipantSessionsToEducationSchedules(
  sessions?: SessionProgress[] | null
): ParticipatingInstructorEducationScheduleRow[] {
  if (!sessions?.length) return []
  return sessions.map((session, index) => ({
    id: session.scheduleId != null ? String(session.scheduleId) : `session-${index}`,
    scheduleLabel: formatSessionProgressLabel(session, index),
    progress: mapSessionProgressStatus(session.attendanceStatus ?? session.assignmentStatus),
  }))
}
