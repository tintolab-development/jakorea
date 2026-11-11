/**
 * 1사1교 배정 일정 표시 — 「날짜 | N~(N+1)교시 (N차시) | 시간」 (회차 없음).
 *
 * 차시 수·교시는 기관 신청 희망 일정(requested-schedules)이 배정 일정(scheduleId)과
 * `resolvedScheduleId` / `resolvedScheduleIds`로 연결될 때만 붙인다. 연결이 없으면
 * 지어내지 않고 「날짜 | 시간」만 쓴다.
 */
import type { RequestedScheduleResponse } from '@/shared/api/generated/dashboard/schemas/requestedScheduleResponse'

export type CompanySchoolScheduleUnit = {
  /** 신청 차시 수(개수) */
  sessionCount?: number
  /** 시작 교시(학교 시간표 번호) */
  startPeriod?: number
}

function positiveInteger(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : undefined
}

function linkedScheduleIds(row: RequestedScheduleResponse): number[] {
  const ids = new Set<number>()
  const single = positiveInteger(row.resolvedScheduleId)
  if (single != null) ids.add(single)
  for (const id of row.resolvedScheduleIds ?? []) {
    const parsed = positiveInteger(id)
    if (parsed != null) ids.add(parsed)
  }
  return [...ids]
}

/**
 * 희망 일정 → 연결된 배정 일정 id별 차시·교시.
 * 한 배정 일정에 서로 다른 희망 일정이 연결되면(모호) 그 일정은 넣지 않는다.
 */
export function buildCompanySchoolScheduleUnitByScheduleId(
  rows: readonly RequestedScheduleResponse[] | null | undefined
): Map<string, CompanySchoolScheduleUnit> {
  const map = new Map<string, CompanySchoolScheduleUnit>()
  const ambiguous = new Set<string>()
  for (const row of rows ?? []) {
    const unit: CompanySchoolScheduleUnit = {
      sessionCount: positiveInteger(row.sessionCount),
      startPeriod: positiveInteger(row.startPeriod),
    }
    if (unit.sessionCount == null && unit.startPeriod == null) continue
    for (const id of linkedScheduleIds(row)) {
      const key = String(id)
      if (ambiguous.has(key)) continue
      if (map.has(key)) {
        map.delete(key)
        ambiguous.add(key)
        continue
      }
      map.set(key, unit)
    }
  }
  return map
}

/**
 * 1사1교 교시 라벨(USER-FUNC-0205) — `N~(N+1)교시 (2차시)` / `N교시 (1차시)`.
 * 2차시 교시는 1차시 교시 + 1(연강 고정). 교시를 모르면 `N차시`, 차시 수를 모르면 `N교시`만.
 */
export function formatCompanySchoolScheduleUnitLabel(
  unit: CompanySchoolScheduleUnit | null | undefined
): string {
  if (!unit) return ''
  const { sessionCount, startPeriod } = unit
  if (startPeriod == null) return sessionCount != null ? `${sessionCount}차시` : ''
  if (sessionCount == null) return `${startPeriod}교시`
  const periods =
    sessionCount > 1 ? `${startPeriod}~${startPeriod + sessionCount - 1}교시` : `${startPeriod}교시`
  return `${periods} (${sessionCount}차시)`
}

/** 배정 일정 한 줄 — ` | ` 는 화면에서 디바이더로 렌더한다 */
export function buildCompanySchoolAssignedScheduleLine(input: {
  date?: string | null
  time?: string | null
  unit?: CompanySchoolScheduleUnit | null
}): string {
  return [input.date?.trim(), formatCompanySchoolScheduleUnitLabel(input.unit), input.time?.trim()]
    .filter((part): part is string => Boolean(part))
    .join(' | ')
}

/** 1사1교 배정 일정 칩 순위 라벨 — 회차 대신 지망 순위만, 모르면 빈 값 */
export function resolveCompanySchoolAssignSessionRoundLabel(session: {
  preferenceOrder?: number | null
}): string {
  const order = positiveInteger(session.preferenceOrder)
  return order != null ? `${order}지망` : ''
}
