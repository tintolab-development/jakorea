import { useMemo } from 'react'
import { Typography } from 'antd'
import { CmsButton } from '@/shared/ui'
import { getUjatInstitutionApplicationRowById } from '@/data/mock/ujat-institution-application-mock'
import { UjatInstitutionScheduleConfirmStatusBadge } from './status-badge'
import type { UjatInstitutionScheduleConfirmStatus } from './types'
import './confirmed-detail-placeholder.css'

export function UjatInstitutionScheduleConfirmConfirmedDetailPlaceholder({
  institutionId,
  scheduleConfirmStatus,
  onBack,
}: {
  institutionId: string
  scheduleConfirmStatus: UjatInstitutionScheduleConfirmStatus
  onBack: () => void
}) {
  const row = useMemo(
    () => getUjatInstitutionApplicationRowById(institutionId),
    [institutionId]
  )

  if (!row) {
    return null
  }

  return (
    <div className="ujat-schedule-confirm-confirmed-detail">
      <div className="ujat-schedule-confirm-confirmed-detail__actions">
        <CmsButton type="button" variant="secondary" size="large" width={160} onClick={onBack}>
          목록으로
        </CmsButton>
      </div>

      <div className="ujat-schedule-confirm-confirmed-detail__summary">
        <Typography.Title level={4} className="ujat-schedule-confirm-confirmed-detail__title">
          {row.institutionName}
        </Typography.Title>
        <UjatInstitutionScheduleConfirmStatusBadge status={scheduleConfirmStatus} />
      </div>

      <Typography.Paragraph type="secondary" className="ujat-schedule-confirm-confirmed-detail__notice">
        일정 확인 현황이 「기관 확인 완료」인 기관은 신청 기관 탭 상세와 일부 항목이 다릅니다.
        <br />
        상세 화면 구성은 추후 반영 예정입니다.
      </Typography.Paragraph>
    </div>
  )
}
