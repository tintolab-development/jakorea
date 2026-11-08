import type { UjatInterviewAssignmentStatus } from '@/features/program/ujat/model/ujat-volunteer-screening-constants'
import { StatusBadge } from '@/shared/components/status-badge'
import { getUjatInterviewAssignmentTextPresentation } from '@/features/program/ujat/model/ujat-volunteer-status-presentation'

export interface InterviewAssignmentStatusTextProps {
  status: UjatInterviewAssignmentStatus
}

export function InterviewAssignmentStatusText({ status }: InterviewAssignmentStatusTextProps) {
  return (
    <StatusBadge domain="custom" variant="text" {...getUjatInterviewAssignmentTextPresentation(status)}
      className={`ujat-interview-assignment-status-text ujat-interview-assignment-status-text--${status}`} />
  )
}
