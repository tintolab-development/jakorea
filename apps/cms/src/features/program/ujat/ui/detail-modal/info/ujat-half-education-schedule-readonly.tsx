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
        서울, 경기, 대전, 인천 : 2026.02.25(수)
        <br />
        대구, 부산, 전주, 광주 : 2026.02.27(금)
      </>
    ),
    deliveryType: '온라인',
  },
  {
    label: '교육 진행',
    schedule: '2026.04.03(금) ~ 2026.06.19(금)',
    deliveryType: '오프라인',
  },
  {
    label: '해단식',
    schedule: '2026.07.03(금)',
    deliveryType: '온라인',
  },
]

export const UJAT_SECOND_HALF_SCHEDULE_ROWS: readonly UjatHalfEducationScheduleRow[] = [
  {
    label: '사전교육(발대식)',
    schedule: (
      <>
        서울, 경기, 대전, 인천 : 2026.08.19(수)
        <br />
        대구, 부산, 전주, 광주 : 2026.08.21(금)
      </>
    ),
    deliveryType: '온라인',
  },
  {
    label: '교육 진행',
    schedule: '2026.09.11(금) ~ 2026.11.20(금)',
    deliveryType: '오프라인',
  },
  {
    label: '해단식',
    schedule: '2026.12.04(금)',
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
    <DetailInfoForm title={title} mode="view" className="detail-info-form--gap">
      {rows.map(row => (
        <UjatHalfEducationScheduleRowView key={row.label} row={row} />
      ))}
    </DetailInfoForm>
  )
}
