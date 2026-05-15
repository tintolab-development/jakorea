/** UJAT 공통 정보 — 상·하반기 교육 일정 조회 테이블(4열 그리드) */

import type { ReactNode } from 'react'
import '@/shared/components/detail-info-form/detail-info-form.css'
import '@/features/program/program-detail/ui/project-info/project-info-form-shared.css'
import './ujat-program-detail-common-info-view.css'

export type UjatHalfEducationScheduleRow = {
  label: string
  schedule: ReactNode
  deliveryType: string
}

export const UJAT_FIRST_HALF_SCHEDULE_ROWS: readonly UjatHalfEducationScheduleRow[] = [
  {
    label: '사전교육(발대식)',
    schedule: (
      <>
        서울, 경기, 대전, 인천 : 26년 2월 25일(수)
        <br />
        대구, 부산, 전주, 광주 : 26년 2월 27일(금)
      </>
    ),
    deliveryType: '온라인',
  },
  {
    label: '교육 진행',
    schedule: '2026년 4월 3일(금) ~ 26년 6월 19일(금)',
    deliveryType: '오프라인',
  },
  {
    label: '해단식',
    schedule: '26년 7월 3일(금)',
    deliveryType: '온라인',
  },
]

export const UJAT_SECOND_HALF_SCHEDULE_ROWS: readonly UjatHalfEducationScheduleRow[] = [
  {
    label: '사전교육(발대식)',
    schedule: (
      <>
        서울, 경기, 대전, 인천 : 26년 8월 19일(수)
        <br />
        대구, 부산, 전주, 광주 : 26년 8월 21일(금)
      </>
    ),
    deliveryType: '온라인',
  },
  {
    label: '교육 진행',
    schedule: '2026년 4월 3일(금) ~ 26년 6월 19일(금)',
    deliveryType: '오프라인',
  },
  {
    label: '해단식',
    schedule: '26년 12월 4일(금)',
    deliveryType: '온라인',
  },
]

export function UjatHalfEducationScheduleReadonly({
  title,
  rows,
}: {
  title: string
  rows: readonly UjatHalfEducationScheduleRow[]
}) {
  return (
    <div className="ujat-program-detail-common-info-view__section ujat-half-education-schedule">
      <h2 className="detail-info-form__title ujat-half-education-schedule__title">{title}</h2>
      <div className="program-detail-info-tab__table-wrapper">
        <table className="program-detail-info-tab__table ujat-half-education-schedule__table">
          <tbody>
            {rows.map(row => (
              <tr key={row.label}>
                <th scope="row">{row.label}</th>
                <td className="ujat-half-education-schedule__td-schedule">{row.schedule}</td>
                <th scope="row" className="ujat-half-education-schedule__th-type">
                  교육 형태
                </th>
                <td className="ujat-half-education-schedule__td-type">{row.deliveryType}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
