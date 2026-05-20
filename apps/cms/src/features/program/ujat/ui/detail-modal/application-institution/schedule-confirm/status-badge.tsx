import {
  UJAT_INSTITUTION_SCHEDULE_CONFIRM_STATUS_LABEL,
  type UjatInstitutionScheduleConfirmStatus,
} from './types'
import './status-badge.css'

export function UjatInstitutionScheduleConfirmStatusBadge({
  status,
}: {
  status: UjatInstitutionScheduleConfirmStatus
}) {
  return (
    <span
      className={`ujat-schedule-confirm-status-badge ujat-schedule-confirm-status-badge--${status}`}
    >
      {UJAT_INSTITUTION_SCHEDULE_CONFIRM_STATUS_LABEL[status]}
    </span>
  )
}
