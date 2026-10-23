import {
  UJAT_INSTITUTION_TEMP_ASSIGNMENT_STATUS_LABEL,
  type UjatInstitutionTempAssignmentStatus,
} from './types'
import './status-badge.css'

export function UjatInstitutionApplicationStatusBadge({
  status,
  label,
}: {
  status: UjatInstitutionTempAssignmentStatus
  label?: string
}) {
  return (
    <span
      className={`ujat-institution-application-status-badge ujat-institution-application-status-badge--${status}`}
    >
      {label ?? UJAT_INSTITUTION_TEMP_ASSIGNMENT_STATUS_LABEL[status]}
    </span>
  )
}
