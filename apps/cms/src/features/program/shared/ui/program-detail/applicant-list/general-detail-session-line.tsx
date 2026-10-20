/**
 * 일반 프로그램 — 진행 희망 교육 일정 한 줄
 * `2026. 04. 20(월) 09:30 ~ 12:20` · 디바이더(10px) · `3차시`
 */

import {
  formatGeneralDetailSessionLine,
  type ApplicantSessionLineInput,
} from './applicants-detail-session-format'
import type { InstitutionApplicationProgramBridge } from '@/features/program/general/lib/institution-application-program-bridge'
import './general-detail-session-line.css'

export function GeneralDetailSessionLine({
  session,
  bridge,
  detailScheduleTimeSpan,
  curriculumSessionLabels,
  preferFormOptionLabel = false,
}: {
  session: ApplicantSessionLineInput
  bridge?: InstitutionApplicationProgramBridge | null
  detailScheduleTimeSpan?: string | null
  curriculumSessionLabels?: readonly string[] | null
  preferFormOptionLabel?: boolean
}) {
  const line = formatGeneralDetailSessionLine(session, bridge, {
    detailScheduleTimeSpan,
    curriculumSessionLabels,
    preferFormOptionLabel,
  })
  if (!line) return <>-</>
  return (
    <div className="general-detail-session-line">
      <span>{line}</span>
    </div>
  )
}
