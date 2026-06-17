/**
 * 참여 기관·참여자(개인) 상세 — 교육 진행 일정 행 (일정 + 진행 현황)
 */

import type { ParticipatingSchoolSession } from '@/data/mock/participating-schools'
import { getSessionLineParts } from '@/features/program/shared/ui/program-detail/applicant-list/applicants-detail-session-format'
import {
  withProgramDetailTdDivider,
  ProgramDetailTdSegmentWrap,
} from '@/features/program/shared/ui/program-detail-td-divider'
import './participating-institution-application-info.css'

const SESSION_STATUS_LABELS: Record<string, string> = {
  completed: '진행 완료',
  pending: '진행 대기',
  not_planned: '미진행 희망',
}

function padScheduleTimePart(part: string): string {
  const trimmed = part.trim()
  const [h, m = '00'] = trimmed.split(':')
  return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`
}

export interface ParticipatingProgressScheduleRowProps {
  rowLabel: string
  session: ParticipatingSchoolSession
}

export function ParticipatingProgressScheduleRow({
  rowLabel,
  session,
}: ParticipatingProgressScheduleRowProps) {
  const { datePart, periodPart } = getSessionLineParts(session, 'general-detail')
  const [startRaw, endRaw] = session.timeRange.split('~')
  const timePart = `${padScheduleTimePart(startRaw)} ~ ${padScheduleTimePart(endRaw ?? startRaw)}`
  const statusLabel = session.status
    ? (SESSION_STATUS_LABELS[session.status] ?? session.status)
    : '미진행 희망'
  const statusClass =
    session.status === 'completed'
      ? 'participating-institution-application-info__session-status--completed'
      : session.status === 'pending'
        ? 'participating-institution-application-info__session-status--pending'
        : 'participating-institution-application-info__session-status--not_planned'

  return (
    <tr>
      <td className="applicant-institution-basic-info__cell applicant-institution-basic-info__cell--label">
        {rowLabel}
      </td>
      <td className="applicant-institution-basic-info__cell applicant-institution-basic-info__cell--value">
        <ProgramDetailTdSegmentWrap>
          {withProgramDetailTdDivider([
            `${datePart} ${timePart}`,
            periodPart,
            <span
              key="status"
              className={`participating-institution-application-info__session-status ${statusClass}`}
            >
              {statusLabel}
            </span>,
          ])}
        </ProgramDetailTdSegmentWrap>
      </td>
    </tr>
  )
}
