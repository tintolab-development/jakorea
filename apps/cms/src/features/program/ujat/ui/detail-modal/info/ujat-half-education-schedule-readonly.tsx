/** UJAT 공통 정보 — 상·하반기 교육 일정 조회 (4열: DetailInfoForm double 행) */

import type { ReactNode } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
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
    schedule: '2026년 9월 11일(금) ~ 26년 11월 20일(금)',
    deliveryType: '오프라인',
  },
  {
    label: '해단식',
    schedule: '26년 12월 4일(금)',
    deliveryType: '온라인',
  },
]

function UjatHalfEducationScheduleRowView({ row }: { row: UjatHalfEducationScheduleRow }) {
  return (
    <DetailInfoForm.Row type="double">
      <DetailInfoForm.Field label={row.label} view={<span>{row.schedule}</span>} />
      <DetailInfoForm.Field label="교육 형태" view={row.deliveryType} />
    </DetailInfoForm.Row>
  )
}

export function UjatHalfEducationScheduleReadonly({
  title,
  rows,
}: {
  title: string
  rows: readonly UjatHalfEducationScheduleRow[]
}) {
  return (
    <div className="ujat-program-detail-common-info-view__section ujat-half-education-schedule">
      <DetailInfoForm title={title} mode="view">
        {rows.map(row => (
          <UjatHalfEducationScheduleRowView key={row.label} row={row} />
        ))}
      </DetailInfoForm>
    </div>
  )
}
