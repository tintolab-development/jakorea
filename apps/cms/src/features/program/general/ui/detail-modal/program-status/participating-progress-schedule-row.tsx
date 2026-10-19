/**
 * 참여 기관·참여자(개인) 상세 — 교육 진행 일정 행 (일정 + 진행 현황)
 */

import { formatCmsScheduleDisplayLabel } from '@/features/program/general/lib/organization-preferred-schedule-label'
import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'
import { getSessionLineParts } from '@/features/program/shared/ui/program-detail/applicant-list/applicants-detail-session-format'
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

function padScheduleTimePart(part: string): string {
  const trimmed = part.trim()
  const [h, m = '00'] = trimmed.split(':')
  return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`
}

export function ParticipatingProgressScheduleValue({
  session,
}: {
  session: ParticipatingSchoolSession
}) {
  const scheduleLabel = session.scheduleLabel?.trim()
  const { label: statusLabel, statusClass } = resolveSessionProgressDisplay(session)
  if (scheduleLabel) {
    return (
      <ProgramDetailTdSegmentWrap>
        {withProgramDetailTdDivider([
          formatCmsScheduleDisplayLabel(scheduleLabel),
          <span
            key="status"
            className={`participating-institution-application-info__session-status ${statusClass}`}
          >
            {statusLabel}
          </span>,
        ])}
      </ProgramDetailTdSegmentWrap>
    )
  }

  const { datePart, periodPart } = getSessionLineParts(session, 'general-detail')
  const [startRaw, endRaw] = session.timeRange.split('~')
  const timePart = `${padScheduleTimePart(startRaw)} ~ ${padScheduleTimePart(endRaw ?? startRaw)}`
  return (
    <ProgramDetailTdSegmentWrap>
      {withProgramDetailTdDivider([
        formatCmsScheduleDisplayLabel(`${datePart} ${timePart}`),
        periodPart,
        <span
          key="status"
          className={`participating-institution-application-info__session-status ${statusClass}`}
        >
          {statusLabel}
        </span>,
      ])}
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
