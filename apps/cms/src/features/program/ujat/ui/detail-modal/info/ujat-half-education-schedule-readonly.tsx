/** UJAT 공통 정보 — 상·하반기 교육 일정 조회 (시안 4082:89939, 4열: DetailInfoForm double 행) */

import type { ReactNode } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import type { UjatHalfEducationScheduleDisplay } from '@/features/program/ujat/lib/ujat-half-education-schedule-display'
import './ujat-program-detail-common-info-view.css'

export type UjatHalfEducationScheduleRow = {
  label: string
  schedule: ReactNode
  deliveryType: string
}

/** 진행 일정 여러 줄(`\n`)을 세로로 유지 — field-content가 flex라 단일 래퍼 + pre-line */
function ScheduleText({ text }: { text: string }) {
  if (!text || text === '-') return <>-</>
  return <span className="ujat-half-education-schedule-readonly__schedule-text">{text}</span>
}

/** 일정명(라벨)은 등록 시 입력한 이름, 교재 교육은 시안에 없어 조회에서 제외 */
export function buildUjatHalfEducationScheduleRows(
  display: UjatHalfEducationScheduleDisplay
): UjatHalfEducationScheduleRow[] {
  return [display.preEducation, display.eventSchedule, display.closingCeremony].map(row => ({
    label: row.scheduleName,
    schedule: <ScheduleText text={row.scheduleText} />,
    deliveryType: row.deliveryLabel,
  }))
}

function UjatHalfEducationScheduleRowView({ row }: { row: UjatHalfEducationScheduleRow }) {
  return (
    <DetailInfoForm.Row type="double">
      <DetailInfoForm.Field label={row.label} view={row.schedule} />
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
    <DetailInfoForm title={title} mode="view">
      {rows.map((row, index) => (
        <UjatHalfEducationScheduleRowView key={`${index}-${row.label}`} row={row} />
      ))}
    </DetailInfoForm>
  )
}
