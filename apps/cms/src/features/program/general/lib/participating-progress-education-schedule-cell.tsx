import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'
import {
  formatParticipatingProgressEducationScheduleLine,
  type GeneralEducationScheduleShape,
} from '@/features/program/general/lib/participating-school-session-display'
import { ScheduleLinesCell } from '@/features/program/shared/ui/schedule-lines-cell'

/** 진행(확정) 교육 일정 셀 — 표시 규칙은 공통 {@link ScheduleLinesCell} (최대 3줄·디바이더·블록 중앙) */
export function ParticipatingProgressEducationScheduleCell({
  sessions,
  shape = null,
  moreUnit = '교육 일정',
}: {
  sessions: readonly ParticipatingSchoolSession[] | null | undefined
  shape?: GeneralEducationScheduleShape | null
  moreUnit?: string
}) {
  const lines = (sessions ?? []).map(session =>
    formatParticipatingProgressEducationScheduleLine(session, shape)
  )
  return <ScheduleLinesCell lines={lines} moreUnit={moreUnit} />
}
