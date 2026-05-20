import {
  UJAT_INSTITUTION_TEMP_ASSIGNMENT_STATUS_LABEL,
  type UjatInstitutionTempAssignmentStatus,
} from './ujat-institution-application-types'
import './ujat-institution-application-status-badge.css'

export function UjatInstitutionApplicationStatusBadge({
  status,
}: {
  status: UjatInstitutionTempAssignmentStatus
}) {
  return (
    <span
      className={`ujat-institution-application-status-badge ujat-institution-application-status-badge--${status}`}
    >
      {UJAT_INSTITUTION_TEMP_ASSIGNMENT_STATUS_LABEL[status]}
    </span>
  )
}
