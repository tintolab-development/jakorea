import { UjatInstitutionApplicationStatusBadge as CalendarUjatInstitutionApplicationStatusBadge } from '@/shared/components/calendar/ui/item-list/ujat-institution-application-status-badge'
import {
  UJAT_INSTITUTION_TEMP_ASSIGNMENT_STATUS_LABEL,
  type UjatInstitutionTempAssignmentStatus,
} from './ujat-institution-application-types'

export function UjatInstitutionApplicationStatusBadge({
  status,
}: {
  status: UjatInstitutionTempAssignmentStatus
}) {
  return (
    <CalendarUjatInstitutionApplicationStatusBadge
      statusKey={status}
      label={UJAT_INSTITUTION_TEMP_ASSIGNMENT_STATUS_LABEL[status]}
    />
  )
}
