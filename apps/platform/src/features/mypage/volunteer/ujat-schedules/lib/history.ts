import type { EducationDisplayStatus } from '../../../education/applications/model/types'
import type {
  EducationScheduleItem,
  EducationScheduleProgressStatus,
} from '../../../education/schedules/model/types'
import {
  EDUCATION_SCHEDULE_ATTENDANCE_LABEL,
  EDUCATION_SCHEDULE_PROGRESS_LABEL,
  resolveEducationScheduleProgressStatus,
  resolveEducationScheduleRowProgressStatus,
} from '../../../education/schedules/lib/schedule-rules.ts'

const SEOUL_YMD = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

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
  | 'classLabel'
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
  const code = readAssignmentCode(item)
  if (code === 'ASSIGNED' || code === 'REASSIGNMENT_REQUIRED') return true
  return (item.classLabel ?? '').trim().length > 0
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
  const date = seoulDateFromHeldAt(heldAt)
  if (!date) return null
  const ymd = SEOUL_YMD.format(date)
  const [year, month] = ymd.split('-')
  if (!year || !month) return null
  return `${year}-${month}`
}

function monthLabelFromKey(monthKey: string): string {
  const [, month] = monthKey.split('-')
  const monthNumber = Number(month)
  if (!Number.isFinite(monthNumber) || monthNumber < 1 || monthNumber > 12) return monthKey
  return `${monthNumber}월`
}

function seoulDateFromHeldAt(heldAt: string): Date | null {
  const trimmed = heldAt.trim()
  if (!trimmed) return null
  const date = /^\d{4}-\d{2}-\d{2}$/.test(trimmed)
    ? new Date(`${trimmed}T00:00:00+09:00`)
    : new Date(trimmed)
  if (Number.isNaN(date.getTime())) return null
  return date
}

export function formatUjatScheduleCardDate(heldAt: string): string | null {
  const date = seoulDateFromHeldAt(heldAt)
  if (!date) return null
  const ymd = SEOUL_YMD.format(date)
  const parts = ymd.split('-')
  const month = Number(parts[1])
  const day = Number(parts[2])
  if (!Number.isFinite(month) || !Number.isFinite(day)) return null
  return `${month}월 ${day}일`
}

const SEOUL_WEEKDAY = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  weekday: 'short',
})

export function formatUjatAttendanceRosterDate(heldAt: string): string | null {
  const date = seoulDateFromHeldAt(heldAt)
  const cardDate = date ? formatUjatScheduleCardDate(heldAt) : null
  if (!date || !cardDate) return null
  const weekday = SEOUL_WEEKDAY.format(date).replace('요일', '')
  return weekday ? `${cardDate} (${weekday})` : cardDate
}

/**
 * 일자 카드 상태 글자 색 — Figma 11005:341655
 * present #4a88ed · late #850d0f · excused(사유 불참) #f07917 · giveUp(활동 포기) #ed4a4c
 * absent(결석)는 목록 시안 없음 → 출석현황 팝업(11005:342162) #c31d20 · scheduled #999
 */
export type UjatScheduleDayStatusTone =
  | 'present'
  | 'late'
  | 'absent'
  | 'excused'
  | 'giveUp'
  | 'scheduled'

export function resolveUjatScheduleDayStatus(item: EducationScheduleItem): {
  label: string
  tone: UjatScheduleDayStatusTone
} {
  if (isCancelledUjatAssignment(item)) {
    return { label: '활동 포기', tone: 'giveUp' }
  }
  const attendance = item.scheduleId === null ? null : item.attendanceStatus
  if (attendance === 'present') return { label: '출석완료', tone: 'present' }
  if (attendance === 'late') return { label: '지각', tone: 'late' }
  if (attendance === 'absent') return { label: '결석', tone: 'absent' }
  if (attendance === 'excused') return { label: '사유 불참', tone: 'excused' }
  if (resolveEducationScheduleProgressStatus(item.heldAt) === 'scheduled') {
    return { label: '교육예정', tone: 'scheduled' }
  }
  return { label: '교육예정', tone: 'scheduled' }
}

/**
 * 월 그룹 진행 상태 — 일정 단위 판정(`resolveEducationScheduleRowProgressStatus`)을 모은다.
 * - 그 달 일정이 모두 완료 → completed(진행 완료)
 * - 모두 아직 열리지 않음 → scheduled(진행 예정)
 * - 그 외(일부 완료·진행 중) → in_progress(진행중)
 */
export function resolveUjatMonthProgressStatus(
  items: readonly EducationScheduleItem[],
  now = new Date(),
): EducationScheduleProgressStatus {
  if (items.length === 0) return 'unscheduled'
  const statuses = items.map(item => resolveEducationScheduleRowProgressStatus(item, now))
  if (statuses.every(status => status === 'completed')) return 'completed'
  if (statuses.every(status => status === 'scheduled' || status === 'unscheduled')) return 'scheduled'
  return 'in_progress'
}

/** Figma 11005:341719 「진행중」(붙여 씀) · 11005:341996 「진행 예정」 */
export function ujatMonthProgressLabel(status: EducationScheduleProgressStatus): string {
  if (status === 'in_progress') return '진행중'
  if (status === 'scheduled') return EDUCATION_SCHEDULE_PROGRESS_LABEL.scheduled
  if (status === 'unscheduled') return EDUCATION_SCHEDULE_PROGRESS_LABEL.unscheduled
  return EDUCATION_SCHEDULE_PROGRESS_LABEL.completed
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
      return '출석현황을 조회할 권한이 없습니다.'
    }
    if (status === 404) {
      return '출석현황을 찾을 수 없습니다.'
    }
  }
  return '출석현황을 불러오지 못했습니다.'
}

function readCheckInErrorCode(error: unknown): string | null {
  if (typeof error !== 'object' || error == null || !('response' in error)) return null
  const data = (error as { response?: { data?: unknown } }).response?.data
  if (!data || typeof data !== 'object') return null
  const record = data as { code?: unknown; error?: { code?: unknown; message?: unknown } }
  const nested = record.error?.code
  if (typeof nested === 'string' && nested.trim()) return nested.trim().toUpperCase()
  if (typeof record.code === 'string' && record.code.trim()) return record.code.trim().toUpperCase()
  return null
}

function readCheckInErrorMessage(error: unknown): string | null {
  if (typeof error !== 'object' || error == null || !('response' in error)) return null
  const data = (error as { response?: { data?: unknown } }).response?.data
  if (!data || typeof data !== 'object') return null
  const record = data as { message?: unknown; error?: { message?: unknown } }
  if (typeof record.error?.message === 'string' && record.error.message.trim()) {
    return record.error.message.trim()
  }
  if (typeof record.message === 'string' && record.message.trim()) return record.message.trim()
  return null
}

export function resolveScheduleCheckInErrorMessage(error: unknown): string {
  const code = readCheckInErrorCode(error)
  if (code === 'ORGANIZATION_PORTAL_CHECK_IN_NOT_AVAILABLE') {
    return (
      readCheckInErrorMessage(error) ??
      '일반 기관 프로그램은 포털 출석 체크인을 지원하지 않습니다. 관리자 출결로 처리됩니다.'
    )
  }
  if (code === 'UJAT_VOLUNTEER_ATTENDANCE_REQUIRED') {
    return readCheckInErrorMessage(error) ?? 'UJAT 봉사 출석은 지정된 출석 절차로 처리해 주세요.'
  }
  if (code === 'PORTAL_CHECK_IN_NOT_AVAILABLE') {
    return readCheckInErrorMessage(error) ?? '포털에서 출석 체크인을 할 수 없습니다.'
  }
  if (typeof error === 'object' && error != null && 'response' in error) {
    const status = (error as { response?: { status?: unknown } }).response?.status
    if (status === 401) {
      return '로그인 정보가 만료되었습니다. 다시 로그인해 주세요.'
    }
    if (status === 403) {
      return '지금은 출석할 수 없습니다. 수업 시작 30분 전부터 출석해 주세요.'
    }
    if (status === 404) {
      return '출석할 일정을 찾을 수 없습니다.'
    }
    if (status === 409) {
      return '출석 상태가 변경되었습니다. 배정 현황을 새로고침한 뒤 다시 시도해 주세요.'
    }
  }
  return '출석 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.'
}
