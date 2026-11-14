/** UJAT 공통 정보 — 교육 진행 일정 설정 조회 (시안 4082:89939, 4열: DetailInfoForm double 행) */

import type { ReactNode } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import type { UjatEducationScheduleSettingsSemesterDisplay } from '@/features/program/ujat/lib/ujat-education-schedule-settings-display'
import { UjatUnavailableDatesView } from './ujat-education-schedule-settings-section'
import './ujat-program-detail-common-info-view.css'

export type UjatEducationScheduleSettingsRow = {
  semesterLabel: string
  scheduleRange: ReactNode
  unavailableLabel: string
  unavailableDates: ReactNode
}

/** 학기별 진행 기간 | 진행 불가일(날짜 · 반복 제외 항목) */
export function buildUjatEducationScheduleSettingsRows(
  h1Display: UjatEducationScheduleSettingsSemesterDisplay,
  h2Display: UjatEducationScheduleSettingsSemesterDisplay
): UjatEducationScheduleSettingsRow[] {
  return [
    { display: h1Display, unavailableLabel: '상반기 교육 진행 불가일' },
    { display: h2Display, unavailableLabel: '하반기 교육 진행 불가일' },
  ].map(({ display, unavailableLabel }) => ({
    semesterLabel: display.semesterLabel,
    scheduleRange: display.scheduleRangeText,
    unavailableLabel,
    unavailableDates: (
      <UjatUnavailableDatesView
        exclusion={display.exclusion}
        unavailableDates={display.unavailableDates}
      />
    ),
  }))
}

function UjatEducationScheduleSettingsRowView({ row }: { row: UjatEducationScheduleSettingsRow }) {
  return (
    <DetailInfoForm.Row type="double">
      <DetailInfoForm.Field label={row.semesterLabel} view={row.scheduleRange} />
      <DetailInfoForm.Field label={row.unavailableLabel} view={row.unavailableDates} />
    </DetailInfoForm.Row>
  )
}

export function UjatEducationScheduleSettingsReadonly({
  rows,
}: {
  rows: readonly UjatEducationScheduleSettingsRow[]
}) {
  return (
    <DetailInfoForm title="교육 진행 일정 설정" mode="view">
      {rows.map(row => (
        <UjatEducationScheduleSettingsRowView key={row.semesterLabel} row={row} />
      ))}
    </DetailInfoForm>
  )
}
