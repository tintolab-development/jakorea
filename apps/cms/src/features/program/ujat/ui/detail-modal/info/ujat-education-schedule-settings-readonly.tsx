/** UJAT 공통 정보 — 교육 진행 일정 설정 조회 (4열: DetailInfoForm double 행) */

import type { ReactNode } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { UjatInlineDividedSegments } from '../shared/ujat-inline-divided-segments'
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
    scheduleRange: '2026.04.03(금) ~ 2026.06.19(금)',
    unavailableLabel: '상반기 교육 진행 불가일',
    unavailableDates: (
      <UjatInlineDividedSegments
        segments={['2026.05.15(금), 2026.06.12(금)', '공휴일']}
      />
    ),
  },
  {
    semesterLabel: '하반기 (2학기)',
    scheduleRange: '2026.09.11(금) ~ 2026.11.20(금)',
    unavailableLabel: '하반기 교육 진행 불가일',
    unavailableDates: (
      <UjatInlineDividedSegments
        segments={['2026.10.23(금), 2026.10.30(금)', '공휴일']}
      />
    ),
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
    <DetailInfoForm title="교육 진행 일정 설정" mode="view" className="detail-info-form--gap">
      {rows.map(row => (
        <UjatEducationScheduleSettingsRowView key={row.semesterLabel} row={row} />
      ))}
    </DetailInfoForm>
  )
}
