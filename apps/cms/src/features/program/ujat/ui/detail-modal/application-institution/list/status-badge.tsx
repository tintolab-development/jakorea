import { StatusBadge } from '@/shared/components/status-badge'
import { getInstitutionApplicationStatusColor } from '@/shared/constants/institution-application-status-colors'
import {
  UJAT_INSTITUTION_TEMP_ASSIGNMENT_STATUS_LABEL,
  type UjatInstitutionTempAssignmentStatus,
} from './types'
import './status-badge.css'

/** Figma Status / Text / 기관 배정 현황 — 색은 기관 신청 상태 Text 정의 */
export function UjatInstitutionApplicationStatusBadge({
  status,
  label,
}: {
  status: UjatInstitutionTempAssignmentStatus
  label?: string
}) {
  return (
    <StatusBadge
      domain="custom"
      variant="text"
      className="ujat-institution-application-status-badge"
      label={label ?? UJAT_INSTITUTION_TEMP_ASSIGNMENT_STATUS_LABEL[status]}
      accentColor={getInstitutionApplicationStatusColor(status, 'text')}
    />
  )
}
