/**
 * 일반 프로그램 — 진행 희망 교육 일정 한 줄
 * `2026. 04. 20(월) 09:30 ~ 12:20` · 디바이더(10px) · `3차시`
 */

import {
  ProgramDetailTdDivider,
  ProgramDetailTdSegmentWrap,
} from '@/features/program/shared/ui/program-detail-td-divider'
import { formatCmsScheduleDisplayLabel } from '@/features/program/general/lib/organization-preferred-schedule-label'
import {
  enrichGeneralDetailScheduleLineLabel,
  getSessionLineParts,
  type ApplicantSessionLineInput,
} from './applicants-detail-session-format'
import type { InstitutionApplicationProgramBridge } from '@/features/program/general/lib/institution-application-program-bridge'
import './general-detail-session-line.css'

export function GeneralDetailSessionLine({
  session,
  bridge,
}: {
  session: ApplicantSessionLineInput
  bridge?: InstitutionApplicationProgramBridge | null
}) {
  const scheduleLabel = session.scheduleLabel?.trim()
  if (scheduleLabel) {
    return (
      <div className="general-detail-session-line">
        <span>
          {formatCmsScheduleDisplayLabel(enrichGeneralDetailScheduleLineLabel(scheduleLabel, bridge))}
        </span>
      </div>
    )
  }

  const { datePart, durationPart, periodPart } = getSessionLineParts(session, 'general-detail', bridge)
  const schedulePart = formatCmsScheduleDisplayLabel(`${datePart} ${durationPart}`)

  if (!periodPart) {
    return (
      <div className="general-detail-session-line">
        <span>
          {formatCmsScheduleDisplayLabel(enrichGeneralDetailScheduleLineLabel(schedulePart, bridge))}
        </span>
      </div>
    )
  }

  return (
    <div className="general-detail-session-line">
      <ProgramDetailTdSegmentWrap>
        <span>{schedulePart}</span>
        <ProgramDetailTdDivider />
        <span>{periodPart}</span>
      </ProgramDetailTdSegmentWrap>
    </div>
  )
}
