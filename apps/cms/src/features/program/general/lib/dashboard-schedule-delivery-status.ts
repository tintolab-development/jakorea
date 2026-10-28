import dayjs from 'dayjs'
import type { ParticipatingSchoolSessionStatusKey } from '@/features/program/general/model/participating-schools'

/** 대시보드 일정 API·participants sessions[].scheduleStatus (교육 진행, 출석과 별개) */
export function normalizeDashboardScheduleDeliveryStatus(
  raw?: string | null
): string {
  return (raw ?? '').trim().toUpperCase()
}

export function mapDashboardScheduleDeliveryToSessionStatus(
  scheduleStatus?: string | null
): ParticipatingSchoolSessionStatusKey {
  const normalized = normalizeDashboardScheduleDeliveryStatus(scheduleStatus)
  if (normalized === 'COMPLETED' || normalized === 'DONE' || normalized === 'FINISHED') {
    return 'completed'
  }
  if (
    normalized === 'UNSCHEDULED' ||
    normalized === 'NOT_PLANNED' ||
    normalized === 'CANCELLED' ||
    normalized === 'CANCELED'
  ) {
    return 'not_planned'
  }
  return 'pending'
}

/**
 * 출석 관리 목록에 API 출석값을 노출할 수 있는 회차인지.
 * 시작 시각이 있으면 그 시각을 기준으로 하고, 진행 대기 상태는 시각이 없을 때만 막는다.
 */
export function isScheduleAttendanceOpenForDisplay(
  input: { scheduleStatus?: string | null; startAt?: string | null },
  now: Date = new Date()
): boolean {
  const normalized = normalizeDashboardScheduleDeliveryStatus(input.scheduleStatus)
  if (
    normalized === 'UNSCHEDULED' ||
    normalized === 'NOT_PLANNED' ||
    normalized === 'CANCELLED' ||
    normalized === 'CANCELED'
  ) {
    return false
  }
  const startAt = input.startAt?.trim()
  if (startAt) {
    const start = dayjs(startAt)
    if (start.isValid()) return !dayjs(now).isBefore(start)
  }
  if (normalized === 'SCHEDULED' || normalized === 'NOT_STARTED' || normalized === 'PENDING') {
    return false
  }
  return true
}

export function mapDashboardScheduleDeliveryToEducationProgress(
  scheduleStatus?: string | null
): 'completed' | 'scheduled' {
  const normalized = normalizeDashboardScheduleDeliveryStatus(scheduleStatus)
  if (normalized === 'COMPLETED' || normalized === 'DONE' || normalized === 'FINISHED') {
    return 'completed'
  }
  return 'scheduled'
}

export function resolveDashboardScheduleDeliveryProgressLabel(
  scheduleStatus?: string | null
): string {
  const normalized = normalizeDashboardScheduleDeliveryStatus(scheduleStatus)
  if (normalized === 'COMPLETED' || normalized === 'DONE' || normalized === 'FINISHED') {
    return '진행 완료'
  }
  if (normalized === 'IN_PROGRESS' || normalized === 'ONGOING') {
    return '진행 중'
  }
  if (normalized === 'SCHEDULED' || normalized === 'NOT_STARTED' || normalized === 'PENDING') {
    return '진행 대기'
  }
  if (normalized === 'UNSCHEDULED') {
    return '미진행'
  }
  return '진행 대기'
}

export function resolveDashboardScheduleDeliveryProgressStatusClass(
  scheduleStatus?: string | null
): 'completed' | 'pending' | 'not_planned' | 'in_progress' {
  const normalized = normalizeDashboardScheduleDeliveryStatus(scheduleStatus)
  if (normalized === 'COMPLETED' || normalized === 'DONE' || normalized === 'FINISHED') {
    return 'completed'
  }
  if (normalized === 'IN_PROGRESS' || normalized === 'ONGOING') {
    return 'in_progress'
  }
  if (
    normalized === 'UNSCHEDULED' ||
    normalized === 'NOT_PLANNED' ||
    normalized === 'CANCELLED' ||
    normalized === 'CANCELED'
  ) {
    return 'not_planned'
  }
  return 'pending'
}
