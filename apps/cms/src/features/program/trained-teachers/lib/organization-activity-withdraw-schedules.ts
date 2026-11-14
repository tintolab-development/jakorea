import type { ActivityWithdrawScheduleOption } from '@/features/program/shared/lib/activity-withdraw-schedule'
import { toDisplayEducationScheduleName } from '@/shared/lib/education-schedule-name'
import type { ProgramScheduleResponse } from '@/shared/api/generated/dashboard/schemas/programScheduleResponse'
import { isTeacherTrainingScheduleName } from '@/features/program/trained-teachers/lib/teacher-training-block'

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

const INACTIVE_SCHEDULE_STATUSES = new Set(['CANCELLED', 'CANCELED', 'DELETED', 'INACTIVE'])

export type TrainedTeacherActivityWithdrawScheduleFilter = {
  /** 기준 시각(ms). 시작 전 일정만 남긴다. */
  nowMs: number
  /** 이 기관에 배정된 교육 일정 id. 비어 있으면 배정 필터를 적용하지 않는다(BE와 같음). */
  assignedScheduleIds?: ReadonlySet<number>
  /** 프로그램에 설정된 연수 일정명 */
  trainingScheduleName?: string | null
}

/**
 * BE `TrainedTeacherActivityBoundaryPolicy`가 받는 기준 일정만 남긴다.
 * 연수 일정·비활성 일정·이미 시작한 일정·이 기관에 배정되지 않은 일정은 선택지에서 뺀다.
 */
export function isTrainedTeacherActivityWithdrawSelectableSchedule(
  schedule: ProgramScheduleResponse,
  filter: TrainedTeacherActivityWithdrawScheduleFilter
): boolean {
  const id = schedule.id
  if (id == null || !Number.isFinite(id) || id < 1) return false
  if (isTeacherTrainingScheduleName(schedule.scheduleName, filter.trainingScheduleName)) return false
  const status = schedule.scheduleStatus?.trim().toUpperCase()
  if (status && INACTIVE_SCHEDULE_STATUSES.has(status)) return false
  const startMs = Date.parse(schedule.startAt?.trim() ?? '')
  if (!Number.isFinite(startMs) || startMs <= filter.nowMs) return false
  const assigned = filter.assignedScheduleIds
  if (assigned && assigned.size > 0 && !assigned.has(id)) return false
  return true
}

/** 활동 포기 모달 — 프로그램 일정 id를 value로 사용 */
export function buildTrainedTeacherActivityWithdrawScheduleOptions(
  schedules: ReadonlyArray<ProgramScheduleResponse>,
  filter?: TrainedTeacherActivityWithdrawScheduleFilter
): ActivityWithdrawScheduleOption[] {
  return schedules
    .map((schedule, index) => {
      const id = schedule.id
      if (id == null || !Number.isFinite(id) || id < 1) return null
      if (filter && !isTrainedTeacherActivityWithdrawSelectableSchedule(schedule, filter)) {
        return null
      }
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
