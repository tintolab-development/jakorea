import type { ParticipatingInstructorEducationScheduleRow } from '@/features/program/general/model/participating-instructors'
import {
  formatEducationRoundSessionLabel,
  toDisplayEducationScheduleName,
} from '@/shared/lib/education-schedule-name'
import type { SessionProgress } from '@/shared/api/generated/dashboard/schemas/sessionProgress'
import { normalizeDashboardScheduleDeliveryStatus } from '@/features/program/general/lib/dashboard-schedule-delivery-status'
import { getSeoulCalendarDate } from '@/shared/utils/date'

function mapSessionProgressStatus(
  raw?: string | null
): ParticipatingInstructorEducationScheduleRow['progress'] {
  const upper = normalizeDashboardScheduleDeliveryStatus(raw)
  if (upper === 'COMPLETED' || upper === 'DONE' || upper === 'FINISHED') return 'completed'
  if (upper === 'IN_PROGRESS' || upper === 'ONGOING') return 'in_progress'
  return 'scheduled'
}

/** UTC 등 시간대가 명시된 ISO 시각은 KST 달력일로, 그 외는 앞 10자리를 그대로 쓴다. */
function toSeoulCalendarDate(startAt: string): string {
  if (/T.*(Z|[+-]\d{2}:?\d{2})$/i.test(startAt)) {
    const parsed = new Date(startAt)
    if (!Number.isNaN(parsed.getTime())) return getSeoulCalendarDate(parsed)
  }
  return startAt.slice(0, 10)
}

function formatSessionProgressLabel(session: SessionProgress, index: number): string {
  const parts: string[] = []
  const roundLabel = formatEducationRoundSessionLabel({ roundNumber: session.sessionNo })
  if (roundLabel) parts.push(roundLabel)
  const scheduleName = toDisplayEducationScheduleName(session.scheduleName)
  if (scheduleName) parts.push(scheduleName)
  if (session.startAt?.trim()) {
    const date = toSeoulCalendarDate(session.startAt.trim()).replace(/-/g, '.')
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
