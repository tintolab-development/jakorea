/** UJAT 공통 정보 — 교육 진행 일정 설정 조회 (4열: DetailInfoForm double 행) */

import type { ReactNode } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import './ujat-program-detail-common-info-view.css'

export type UjatEducationScheduleSettingsRow = {
  semesterLabel: string
  scheduleRange: ReactNode
  unavailableLabel: string
  unavailableDates: ReactNode
}

export const UJAT_EDUCATION_SCHEDULE_SETTINGS_ROWS: readonly UjatEducationScheduleSettingsRow[] = [
  {
    semesterLabel: '상반기 (1학기)',
    scheduleRange: '26년 4월 3일(금) ~ 26년 6월 19일(금)',
    unavailableLabel: '상반기 교육 진행 불가일',
    unavailableDates: '26년 5월 15일(금), 26년 6월 12일(금) | 공휴일',
  },
  {
    semesterLabel: '하반기 (2학기)',
    scheduleRange: '26년 9월 11일(금) ~ 26년 11월 20일(금)',
    unavailableLabel: '하반기 교육 진행 불가일',
    unavailableDates: '26년 10월 23일(금), 26년 10월 30일(금) | 공휴일',
  },
]

function UjatEducationScheduleSettingsRowView({ row }: { row: UjatEducationScheduleSettingsRow }) {
  return (
    <DetailInfoForm.Row type="double">
      <DetailInfoForm.Field label={row.semesterLabel} view={row.scheduleRange} />
      <DetailInfoForm.Field label={row.unavailableLabel} view={row.unavailableDates} />
    </DetailInfoForm.Row>
  )
}

export function UjatEducationScheduleSettingsReadonly({
  rows = UJAT_EDUCATION_SCHEDULE_SETTINGS_ROWS,
}: {
  rows?: readonly UjatEducationScheduleSettingsRow[]
}) {
  return (
    <div className="ujat-program-detail-common-info-view__section">
      <DetailInfoForm title="교육 진행 일정 설정" mode="view">
        {rows.map(row => (
          <UjatEducationScheduleSettingsRowView key={row.semesterLabel} row={row} />
        ))}
      </DetailInfoForm>
    </div>
  )
}
