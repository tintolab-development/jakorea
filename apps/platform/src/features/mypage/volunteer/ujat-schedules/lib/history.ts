import type { EducationDisplayStatus } from '../../../education/applications/model/types'
import type { EducationScheduleItem } from '../../../education/schedules/model/types'
import { EDUCATION_SCHEDULE_ATTENDANCE_LABEL } from '../../../education/schedules/lib/schedule-rules'

export const UJAT_SCHEDULE_ACTION_VIEW_ATTENDANCE = 'VIEW_ATTENDANCE'
export const UJAT_SCHEDULE_ACTION_CHECK_IN = 'CHECK_IN'

export type UjatVolunteerWithdrawnDetailView = 'loading' | 'error' | 'history' | 'applied'

type ScheduleActionItem = Pick<EducationScheduleItem, 'availableActions' | 'attendanceStatus'>

type ScheduleRecordItem = Pick<
  EducationScheduleItem,
  | 'availableActions'
  | 'attendanceStatus'
  | 'assignmentStatus'
  | 'scheduleStatus'
  | 'scheduleId'
  | 'heldAt'
  | 'id'
>

function normalizeAction(value: string): string {
  return value.trim().toUpperCase()
}

export function hasUjatScheduleAction(
  actions: readonly string[] | undefined,
  action: string,
): boolean {
  const target = normalizeAction(action)
  if (!target) return false
  return (actions ?? []).some(item => normalizeAction(item) === target)
}

export function canViewUjatScheduleAttendance(item: ScheduleActionItem): boolean {
  return hasUjatScheduleAction(item.availableActions, UJAT_SCHEDULE_ACTION_VIEW_ATTENDANCE)
}

export function canCheckInUjatSchedule(
  item: ScheduleActionItem,
  options?: { withdrawn?: boolean },
): boolean {
  if (options?.withdrawn) return false
  return hasUjatScheduleAction(item.availableActions, UJAT_SCHEDULE_ACTION_CHECK_IN)
}

/** 조회 가능한 출결 기록. ABSENT만으로 실제 참여 완료로 단정하지 않는다. */
export function hasQueryableUjatEducationHistory(item: ScheduleActionItem): boolean {
  return canViewUjatScheduleAttendance(item) || item.attendanceStatus != null
}

function readAssignmentCode(item: ScheduleRecordItem): string {
  return (item.assignmentStatus ?? item.scheduleStatus ?? '').trim().toUpperCase()
}

export function isCancelledUjatAssignment(item: ScheduleRecordItem): boolean {
  const code = readAssignmentCode(item)
  return code === 'CANCELLED' || code === 'CANCELED'
}

export function isAssignedUjatSchedule(item: ScheduleRecordItem): boolean {
  return readAssignmentCode(item) === 'ASSIGNED'
}

/**
 * 본인 배정·출결 기록.
 * 프로그램 전체 일정, 시작 전 취소 배정은 참여 이력으로 취급하지 않는다.
 */
export function isUjatVolunteerOwnScheduleRecord(
  item: ScheduleRecordItem,
  options?: { includeAssignedWithoutAttendance?: boolean },
): boolean {
  const cancelled = isCancelledUjatAssignment(item)
  if (cancelled && !hasQueryableUjatEducationHistory(item)) {
    return false
  }
  if (hasQueryableUjatEducationHistory(item)) return true
  if (options?.includeAssignedWithoutAttendance === true && isAssignedUjatSchedule(item)) {
    return true
  }
  return false
}

export function resolveUjatVolunteerWithdrawnDetailView(input: {
  isUjatVolunteer: boolean
  displayStatus: EducationDisplayStatus | undefined
  schedulesQuery: {
    enabled: boolean
    isLoading: boolean
    isError: boolean
    items: readonly ScheduleActionItem[]
  }
}): UjatVolunteerWithdrawnDetailView | null {
  if (!input.isUjatVolunteer || input.displayStatus !== 'withdrawn') return null
  if (input.schedulesQuery.isError) return 'error'
  if (input.schedulesQuery.enabled && input.schedulesQuery.isLoading) return 'loading'
  if (input.schedulesQuery.items.some(hasQueryableUjatEducationHistory)) return 'history'
  return 'applied'
}

export type UjatVolunteerScheduleMonthGroup = {
  monthKey: string
  monthLabel: string
  items: EducationScheduleItem[]
}

function monthKeyFromHeldAt(heldAt: string): string | null {
  const date = new Date(heldAt)
  if (Number.isNaN(date.getTime())) return null
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function monthLabelFromKey(monthKey: string): string {
  const [year, month] = monthKey.split('-')
  const yearNumber = Number(year)
  const monthNumber = Number(month)
  if (!Number.isFinite(yearNumber) || !Number.isFinite(monthNumber)) return monthKey
  return `${yearNumber}년 ${monthNumber}월`
}

export function groupUjatVolunteerSchedulesByMonth(
  items: readonly EducationScheduleItem[],
): UjatVolunteerScheduleMonthGroup[] {
  const groups = new Map<string, EducationScheduleItem[]>()
  const unlabeled: EducationScheduleItem[] = []

  for (const item of items) {
    const key = monthKeyFromHeldAt(item.heldAt)
    if (!key) {
      unlabeled.push(item)
      continue
    }
    const current = groups.get(key) ?? []
    current.push(item)
    groups.set(key, current)
  }

  const labeled = [...groups.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([monthKey, monthItems]) => ({
      monthKey,
      monthLabel: monthLabelFromKey(monthKey),
      items: monthItems,
    }))

  if (unlabeled.length === 0) return labeled
  return [
    ...labeled,
    {
      monthKey: 'undated',
      monthLabel: '일정 미정',
      items: unlabeled,
    },
  ]
}

export function formatUjatAssignmentStatusLabel(value: string | null | undefined): string {
  const code = value?.trim().toUpperCase()
  if (!code) return '-'
  if (code === 'ASSIGNED') return '배정'
  if (code === 'WAITING') return '배정 대기'
  if (code === 'CANCELLED' || code === 'CANCELED') return '배정 취소'
  return value!.trim()
}

export function formatUjatAttendanceStatusLabel(
  status: EducationScheduleItem['attendanceStatus'],
): string {
  if (!status) return '-'
  return EDUCATION_SCHEDULE_ATTENDANCE_LABEL[status]
}

export function resolveScheduleAttendanceQueryErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error != null && 'response' in error) {
    const status = (error as { response?: { status?: unknown } }).response?.status
    if (status === 401 || status === 403) {
      return '출결 상세를 조회할 권한이 없습니다.'
    }
    if (status === 404) {
      return '출결 상세를 찾을 수 없습니다.'
    }
  }
  return '출결 상세를 불러오지 못했습니다.'
}
