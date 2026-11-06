/**
 * 참여 기관·참여자(개인) 상세 — 교육 진행 일정 행 (일정 + 진행 현황)
 */

import {
  formatGeneralEducationScheduleLine,
  type GeneralEducationScheduleShape,
} from '@/features/program/general/lib/participating-school-session-display'
import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'
import {
  withProgramDetailTdDivider,
  ProgramDetailTdSegmentWrap,
} from '@/features/program/shared/ui/program-detail-td-divider'
import {
  resolveDashboardScheduleDeliveryProgressLabel,
  resolveDashboardScheduleDeliveryProgressStatusClass,
} from '@/features/program/general/lib/dashboard-schedule-delivery-status'
import './participating-institution-application-info.css'

const SESSION_STATUS_LABELS: Record<string, string> = {
  completed: '진행 완료',
  pending: '진행 대기',
  not_planned: '미진행 희망',
}

function resolveSessionProgressDisplay(session: ParticipatingSchoolSession): {
  label: string
  statusClass: string
} {
  if (session.deliveryScheduleStatus?.trim()) {
    const kind = resolveDashboardScheduleDeliveryProgressStatusClass(session.deliveryScheduleStatus)
    return {
      label: resolveDashboardScheduleDeliveryProgressLabel(session.deliveryScheduleStatus),
      statusClass: `participating-institution-application-info__session-status--${kind}`,
    }
  }
  const status = session.status
  const label = status ? (SESSION_STATUS_LABELS[status] ?? status) : '미진행 희망'
  const statusClass =
    status === 'completed'
      ? 'participating-institution-application-info__session-status--completed'
      : status === 'pending'
        ? 'participating-institution-application-info__session-status--pending'
        : 'participating-institution-application-info__session-status--not_planned'
  return { label, statusClass }
}

export function ParticipatingProgressScheduleValue({
  session,
  shape = null,
  detailScheduleTimeSpan = null,
  statusBadge,
}: {
  session: ParticipatingSchoolSession
  shape?: GeneralEducationScheduleShape | null
  detailScheduleTimeSpan?: string | null
  /** 전달되면 일반 세션 status fallback을 쓰지 않는다. null이면 뱃지 생략. */
  statusBadge?: { label: string; statusClass: string } | null
}) {
  const line = formatGeneralEducationScheduleLine(session, shape, { detailScheduleTimeSpan })
  const resolved =
    statusBadge === undefined ? resolveSessionProgressDisplay(session) : statusBadge
  const status = resolved ? (
    <span
      key="status"
      className={`participating-institution-application-info__session-status ${resolved.statusClass}`}
    >
      {resolved.label}
    </span>
  ) : null
  const parts = line
    .split(' | ')
    .map(part => part.trim())
    .filter(Boolean)
  return (
    <ProgramDetailTdSegmentWrap>
      {withProgramDetailTdDivider(status ? [...parts, status] : parts)}
    </ProgramDetailTdSegmentWrap>
  )
}

export interface ParticipatingProgressScheduleRowProps {
  rowLabel: string
  session: ParticipatingSchoolSession
}

export function ParticipatingProgressScheduleRow({
  rowLabel,
  session,
}: ParticipatingProgressScheduleRowProps) {
  return (
    <tr>
      <td className="applicant-institution-basic-info__cell applicant-institution-basic-info__cell--label">
        {rowLabel}
      </td>
      <td className="applicant-institution-basic-info__cell applicant-institution-basic-info__cell--value">
        <ParticipatingProgressScheduleValue session={session} />
      </td>
    </tr>
  )
}
