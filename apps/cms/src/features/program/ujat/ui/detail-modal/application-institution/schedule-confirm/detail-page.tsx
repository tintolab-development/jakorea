import { useMemo } from 'react'
import { getUjatInstitutionScheduleConfirmStatus } from '@/data/mock/ujat-institution-application-mock'
import { UjatInstitutionApplicationDetailPage } from '../detail/detail-page'
import { UjatInstitutionScheduleConfirmConfirmedDetailPlaceholder } from './confirmed-detail-placeholder'
import type { UjatInstitutionScheduleConfirmStatus } from './types'

/** 기관 확인 중·신청 반려 — 신청 기관 탭 상세와 동일 */
export function isScheduleConfirmApplicationDetailStatus(
  status: UjatInstitutionScheduleConfirmStatus
): boolean {
  return status === 'institution_checking' || status === 'application_rejected'
}

export function UjatInstitutionScheduleConfirmDetailPage({
  institutionId,
  onBack,
  onStatusUpdated,
}: {
  institutionId: string
  onBack: () => void
  onStatusUpdated: () => void
}) {
  const scheduleConfirmStatus = useMemo(
    () => getUjatInstitutionScheduleConfirmStatus(institutionId),
    [institutionId]
  )

  if (isScheduleConfirmApplicationDetailStatus(scheduleConfirmStatus)) {
    return (
      <UjatInstitutionApplicationDetailPage
        institutionId={institutionId}
        onBack={onBack}
        onStatusUpdated={onStatusUpdated}
      />
    )
  }

  return (
    <UjatInstitutionScheduleConfirmConfirmedDetailPlaceholder
      institutionId={institutionId}
      scheduleConfirmStatus={scheduleConfirmStatus}
      onBack={onBack}
    />
  )
}
