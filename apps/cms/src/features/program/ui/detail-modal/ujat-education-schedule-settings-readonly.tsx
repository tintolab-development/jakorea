/** UJAT 공통 정보 — 교육 진행 일정 설정 조회 테이블(4열, 상·하반기 2행) */

import type { ReactNode } from 'react'
import '@/shared/components/detail-info-form/detail-info-form.css'
import '@/features/program/program-detail/ui/project-info/project-info-form-shared.css'
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

export function UjatEducationScheduleSettingsReadonly({
  rows = UJAT_EDUCATION_SCHEDULE_SETTINGS_ROWS,
}: {
  rows?: readonly UjatEducationScheduleSettingsRow[]
}) {
  return (
    <div className="ujat-program-detail-common-info-view__section ujat-education-schedule-settings-readonly">
      <h2 className="detail-info-form__title ujat-education-schedule-settings-readonly__title">
        교육 진행 일정 설정
      </h2>
      <div className="program-detail-info-tab__table-wrapper">
        <table className="program-detail-info-tab__table ujat-education-schedule-settings-readonly__table">
          <tbody>
            {rows.map(row => (
              <tr key={row.semesterLabel}>
                <th scope="row">{row.semesterLabel}</th>
                <td className="ujat-education-schedule-settings-readonly__td-value">{row.scheduleRange}</td>
                <th scope="row" className="ujat-education-schedule-settings-readonly__th-unavailable">
                  {row.unavailableLabel}
                </th>
                <td className="ujat-education-schedule-settings-readonly__td-value">{row.unavailableDates}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
