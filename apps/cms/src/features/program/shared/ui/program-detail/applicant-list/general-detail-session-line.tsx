/**
 * 일반 프로그램 — 진행 희망 교육 일정 한 줄
 * `2026. 04. 20(월) 09:30 ~ 12:20` · 디바이더(10px) · `3차시`
 */

import {
  ProgramDetailTdDivider,
  ProgramDetailTdSegmentWrap,
} from '@/features/program/shared/ui/program-detail-td-divider'
import {
  getSessionLineParts,
  type ApplicantSessionLineInput,
} from './applicants-detail-session-format'
import './general-detail-session-line.css'

export function GeneralDetailSessionLine({ session }: { session: ApplicantSessionLineInput }) {
  const { datePart, durationPart, periodPart } = getSessionLineParts(session, 'general-detail')
  const schedulePart = `${datePart} ${durationPart}`

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
