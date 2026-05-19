import type { UjatInterviewAssignmentStatus } from '@/features/program/model/ujat-volunteer-screening-constants'
import { UJAT_INTERVIEW_ASSIGNMENT_STATUS_LABELS } from '@/features/program/model/ujat-volunteer-screening-constants'
import './interview-assignment-status-text.css'

export interface InterviewAssignmentStatusTextProps {
  status: UjatInterviewAssignmentStatus
}

export function InterviewAssignmentStatusText({ status }: InterviewAssignmentStatusTextProps) {
  return (
    <span
      className={`ujat-interview-assignment-status-text ujat-interview-assignment-status-text--${status}`}
    >
      {UJAT_INTERVIEW_ASSIGNMENT_STATUS_LABELS[status]}
    </span>
  )
}
