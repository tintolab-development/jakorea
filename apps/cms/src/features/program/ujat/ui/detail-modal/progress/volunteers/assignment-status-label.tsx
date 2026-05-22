import {
  UJAT_EDU_PROGRESS_VOLUNTEER_ASSIGNMENT_STATUS_LABEL,
  type UjatEducationProgressVolunteerAssignmentStatus,
} from './types'
import './assignment-status-label.css'

export function UjatEducationProgressVolunteerAssignmentStatusLabel({
  status,
}: {
  status: UjatEducationProgressVolunteerAssignmentStatus
}) {
  return (
    <span
      className={`ujat-edu-progress-volunteer-status ujat-edu-progress-volunteer-status--${status}`}
    >
      {UJAT_EDU_PROGRESS_VOLUNTEER_ASSIGNMENT_STATUS_LABEL[status]}
    </span>
  )
}
