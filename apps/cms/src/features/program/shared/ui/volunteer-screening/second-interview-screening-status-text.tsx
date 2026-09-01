import {
  SECOND_INTERVIEW_SCREENING_STATUS_LABELS,
  type SecondInterviewScreeningStatus,
} from '@/features/program/shared/lib/volunteer-screening/second-interview-screening-constants'
import { resolveSecondInterviewScreeningTone } from '@/features/program/shared/lib/volunteer-screening/second-interview-screening-ui'
import './second-interview-screening-tone.css'

export interface SecondInterviewScreeningStatusTextProps {
  status: SecondInterviewScreeningStatus
}

export function SecondInterviewScreeningStatusText({
  status,
}: SecondInterviewScreeningStatusTextProps) {
  const tone = resolveSecondInterviewScreeningTone(status)
  return (
    <span
      className={[
        'second-interview-screening-status-text',
        `second-interview-screening-tone--${tone}`,
      ].join(' ')}
    >
      {SECOND_INTERVIEW_SCREENING_STATUS_LABELS[status]}
    </span>
  )
}
