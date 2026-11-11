import type { ParticipatingInstructorEducationScheduleRow } from '@/features/program/general/model/participating-instructors'
import {
  formatEducationScheduleUnitLabel,
  positiveEducationNumber,
  toDisplayEducationScheduleName,
} from '@/shared/lib/education-schedule-name'
import type { SessionProgress } from '@/shared/api/generated/dashboard/schemas/sessionProgress'
import { normalizeDashboardScheduleDeliveryStatus } from '@/features/program/general/lib/dashboard-schedule-delivery-status'
import { isProgramSchedulePreEducation } from '@/features/program/shared/lib/program-schedule-canonical'
import { PRE_EDUCATION_DISPLAY_LABEL } from '@/features/program/general/lib/schedule-detail-form'
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

/**
 * 일정 선택지 `{단위} · {날짜}`.
 * 단위 = 사전교육 / 세부 일정명(일정형 — 자동 기본명 제외) / 없으면 `N회차`(+차시 수).
 * 일정형 일정에 회차 번호를 함께 붙이지 않는다.
 */
function formatSessionProgressLabel(session: SessionProgress): string {
  const parts: string[] = []
  const scheduleName = toDisplayEducationScheduleName(session.scheduleName)
  if (isProgramSchedulePreEducation(session)) {
    parts.push(PRE_EDUCATION_DISPLAY_LABEL)
  } else if (scheduleName && scheduleName !== PRE_EDUCATION_DISPLAY_LABEL) {
    parts.push(scheduleName)
  } else {
    const roundLabel = formatEducationScheduleUnitLabel({
      sessionNo: session.sessionNo,
      curriculumSessionCount: positiveEducationNumber(
        (session as SessionProgress & { curriculumSessionCount?: number | null }).curriculumSessionCount
      ),
    })
    if (roundLabel) parts.push(roundLabel)
  }
  if (session.startAt?.trim()) {
    const date = toSeoulCalendarDate(session.startAt.trim()).replace(/-/g, '.')
    parts.push(date)
  }
  if (parts.length === 0) return '교육 일정'
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
      scheduleLabel: formatSessionProgressLabel(session),
      progress: mapSessionProgressStatus(session.scheduleStatus),
    }
  })
}
