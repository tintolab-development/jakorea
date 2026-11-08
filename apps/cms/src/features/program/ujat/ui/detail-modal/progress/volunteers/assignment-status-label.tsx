import type { UjatEducationProgressVolunteerAssignmentStatus } from './types'
import { StatusBadge } from '@/shared/components/status-badge'
import { getUjatEducationVolunteerAssignmentTextPresentation } from '@/features/program/ujat/model/ujat-volunteer-status-presentation'

export function UjatEducationProgressVolunteerAssignmentStatusLabel({ status }: {
  status: UjatEducationProgressVolunteerAssignmentStatus
}) {
  return <StatusBadge domain="custom" variant="text" {...getUjatEducationVolunteerAssignmentTextPresentation(status)}
    className={`ujat-edu-progress-volunteer-status ujat-edu-progress-volunteer-status--${status}`} />
}
