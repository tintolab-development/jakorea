import { StatusBadge } from '@/shared/components/status-badge'
import { getInstitutionApplicationStatusColor } from '@/shared/constants/institution-application-status-colors'
import {
  UJAT_INSTITUTION_SCHEDULE_CONFIRM_STATUS_LABEL,
  type UjatInstitutionScheduleConfirmStatus,
} from './types'
import './status-badge.css'

/** Figma Status / Text / 일정 확인 현황 — 색은 기관 신청 상태 Text 정의 */
export function UjatInstitutionScheduleConfirmStatusBadge({
  status,
}: {
  status: UjatInstitutionScheduleConfirmStatus
}) {
  return (
    <StatusBadge
      domain="custom"
      variant="text"
      className="ujat-schedule-confirm-status-badge"
      label={UJAT_INSTITUTION_SCHEDULE_CONFIRM_STATUS_LABEL[status]}
      accentColor={getInstitutionApplicationStatusColor(status, 'text')}
    />
  )
}
