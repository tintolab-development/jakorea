import type { ParticipatingInstructorEducationScheduleRow } from '@/features/program/general/model/participating-instructors'
import { toDisplayEducationScheduleName } from '@/shared/lib/education-schedule-name'
import type { SessionProgress } from '@/shared/api/generated/dashboard/schemas/sessionProgress'
import { normalizeDashboardScheduleDeliveryStatus } from '@/features/program/general/lib/dashboard-schedule-delivery-status'

function mapSessionProgressStatus(
  raw?: string | null
): ParticipatingInstructorEducationScheduleRow['progress'] {
  const upper = normalizeDashboardScheduleDeliveryStatus(raw)
  if (upper === 'COMPLETED' || upper === 'DONE' || upper === 'FINISHED') return 'completed'
  if (upper === 'IN_PROGRESS' || upper === 'ONGOING') return 'in_progress'
  return 'scheduled'
}

function formatSessionProgressLabel(session: SessionProgress, index: number): string {
  const parts: string[] = []
  if (session.sessionNo != null) parts.push(`${session.sessionNo}차시`)
  const scheduleName = toDisplayEducationScheduleName(session.scheduleName)
  if (scheduleName) parts.push(scheduleName)
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
  return sessions.map((session, index) => {
    const resolvedId = session.resolvedScheduleId ?? session.scheduleId
    const id =
      resolvedId != null
        ? String(resolvedId)
        : session.requestedScheduleId != null
          ? `requested-${session.requestedScheduleId}`
          : `session-${index}`
    return {
      id,
      scheduleLabel: formatSessionProgressLabel(session, index),
      progress: mapSessionProgressStatus(session.scheduleStatus),
    }
  })
}
