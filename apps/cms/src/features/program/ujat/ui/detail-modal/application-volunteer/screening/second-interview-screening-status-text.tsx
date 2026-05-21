import type { UjatSecondInterviewScreeningStatus } from '@/features/program/ujat/model/ujat-volunteer-screening-constants'
import { UJAT_SECOND_INTERVIEW_SCREENING_STATUS_LABELS } from '@/features/program/ujat/model/ujat-volunteer-screening-constants'
import './second-interview-screening-status-text.css'

export interface SecondInterviewScreeningStatusTextProps {
  status: UjatSecondInterviewScreeningStatus
}

export function SecondInterviewScreeningStatusText({ status }: SecondInterviewScreeningStatusTextProps) {
  return (
    <span
      className={`second-interview-screening-status-text second-interview-screening-status-text--${status}`}
    >
      {UJAT_SECOND_INTERVIEW_SCREENING_STATUS_LABELS[status]}
    </span>
  )
}
