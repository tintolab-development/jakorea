import type { ActivityWithdrawScheduleOption } from '@/features/program/shared/lib/activity-withdraw-schedule'
import { toDisplayEducationScheduleName } from '@/shared/lib/education-schedule-name'
import type { ProgramScheduleResponse } from '@/shared/api/generated/dashboard/schemas/programScheduleResponse'

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

function formatScheduleDateTime(iso?: string): string {
  const trimmed = iso?.trim()
  if (!trimmed) return ''
  const date = new Date(trimmed)
  if (Number.isNaN(date.getTime())) return trimmed
  return `${date.getFullYear()}.${pad2(date.getMonth() + 1)}.${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`
}

export function formatTrainedTeacherProgramScheduleOptionLabel(
  schedule: ProgramScheduleResponse,
  index: number
): string {
  const name = toDisplayEducationScheduleName(schedule.scheduleName)
  const sessionNo =
    typeof schedule.sessionNo === 'number' && Number.isFinite(schedule.sessionNo)
      ? schedule.sessionNo
      : index + 1
  const start = formatScheduleDateTime(schedule.startAt ?? schedule.startDate)
  const end = formatScheduleDateTime(schedule.endAt ?? schedule.endDate)
  const range = start && end ? `${start} ~ ${end}` : start || end
  const title = name || `교육 일정 ${sessionNo}`
  return range ? `${title} | ${range}` : title
}

/** 활동 포기 모달 — 프로그램 일정 id를 value로 사용 */
export function buildTrainedTeacherActivityWithdrawScheduleOptions(
  schedules: ReadonlyArray<ProgramScheduleResponse>
): ActivityWithdrawScheduleOption[] {
  return schedules
    .map((schedule, index) => {
      const id = schedule.id
      if (id == null || !Number.isFinite(id) || id < 1) return null
      return {
        value: String(id),
        label: formatTrainedTeacherProgramScheduleOptionLabel(schedule, index),
      }
    })
    .filter((option): option is ActivityWithdrawScheduleOption => option != null)
}

export function parseTrainedTeacherStopScheduleId(raw: string | undefined): number | null {
  const id = Number(raw)
  if (!Number.isFinite(id) || id < 1) return null
  return id
}
