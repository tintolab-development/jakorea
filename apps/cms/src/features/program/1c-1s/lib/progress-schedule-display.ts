/**
 * 1사1교 프로그램 진행 현황 — 참여 기관 일정 표시 기준.
 *
 * 확정 일정(participants.sessions)이 있으면 그것만 쓰고, 없으면(승인 시 일정 확정 미지원 등)
 * 기관 신청 희망 일정(requested-schedules)을 쓴다. 백엔드가 확정 일정을 내려주면 자동으로 확정만 보인다.
 */
import type {
  ParticipatingSchoolRow,
  ParticipatingSchoolSession,
} from '@/features/program/general/model/participating-schools'
import {
  resolveParticipatingProgressAssignedSessions,
  resolveParticipatingSchoolHopeSessions,
} from '@/features/program/general/lib/organization-education-schedule-sources'
import { formatCmsScheduleDisplayLabel } from '@/features/program/general/lib/organization-preferred-schedule-label'
import type { RequestedScheduleResponse } from '@/shared/api/generated/dashboard/schemas/requestedScheduleResponse'
import { formatCompanySchoolScheduleUnitLabel } from './assigned-schedule-line'

/** 확정 일정(미진행 제외) */
export function resolveCompanySchoolConfirmedSessions(
  row: Pick<ParticipatingSchoolRow, 'sessions'>
): ParticipatingSchoolSession[] {
  return resolveParticipatingProgressAssignedSessions(row.sessions).filter(
    session => session.status !== 'not_planned'
  )
}

/** 참여 기관 목록·캘린더 — 확정 일정 우선, 없으면 희망 일정 */
export function resolveCompanySchoolProgressDisplaySessions(
  row: Pick<
    ParticipatingSchoolRow,
    'hopeEducationSessions' | 'preferredEducationSchedules' | 'sessions' | 'programId' | 'organizationApplicationId'
  >
): ParticipatingSchoolSession[] {
  const confirmed = resolveCompanySchoolConfirmedSessions(row)
  if (confirmed.length > 0) return confirmed
  return resolveParticipatingSchoolHopeSessions(row).filter(session => session.status !== 'not_planned')
}

export type CompanySchoolHopeScheduleBlock = {
  key: string
  /** 지망 순위. 모르면 null */
  preferenceOrder: number | null
  /** `2026.04.27(월)` */
  dateLabel: string
  /** 신청 차시 수. 모르면 null(표기 생략) */
  sessionCount: number | null
  /** 시작 교시. 모르면 null */
  startPeriod: number | null
  /** 「교육일 및 차시」 칸 — `YYYY.MM.DD(요일)`, `N~(N+1)교시 (N차시)` (아는 값만) */
  dateUnitSegments: string[]
  /** `1교시 (09:00 ~ 09:40)` — 교시를 모르면 시간만 */
  periodTimeLabels: string[]
}

function positiveInteger(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null
}

function toClock(raw: string | null | undefined): string | null {
  const match = raw?.trim().match(/^(\d{1,2}):(\d{2})/u)
  return match ? `${match[1]!.padStart(2, '0')}:${match[2]}` : null
}

/**
 * 참여 기관 상세 「교육 진행 일정」 희망 일정 블록 — requested-schedules의 날짜·차시 수·교시별 시간.
 * 교시는 `startPeriod + 순번`(연강 고정), 시작 교시가 없으면 `sessionTimes[].period`. 둘 다 없으면 시간만 쓴다.
 */
export function buildCompanySchoolHopeScheduleBlocks(
  rows: readonly RequestedScheduleResponse[] | null | undefined
): CompanySchoolHopeScheduleBlock[] {
  return [...(rows ?? [])]
    .filter(row => Boolean(row.requestedDate?.trim()))
    .sort((a, b) => (a.preferenceOrder ?? 99) - (b.preferenceOrder ?? 99))
    .map((row, index) => {
      const startPeriod = positiveInteger(row.startPeriod)
      const times = [...(row.sessionTimes ?? [])].sort(
        (a, b) => (a.sessionOrder ?? 0) - (b.sessionOrder ?? 0)
      )
      const periodTimeLabels = times
        .map((time, timeIndex) => {
          const start = toClock(time.startTime)
          const end = toClock(time.endTime)
          if (!start || !end) return null
          // 2차시 교시는 1차시 교시 + 1(연강 고정) — 시작 교시가 있으면 그것을 기준으로
          const period =
            startPeriod != null ? startPeriod + timeIndex : positiveInteger(time.period)
          const range = `${start} ~ ${end}`
          return period != null ? `${period}교시 (${range})` : range
        })
        .filter((label): label is string => label != null)
      const sessionCount =
        positiveInteger(row.sessionCount) ?? (times.length > 0 ? times.length : null)
      const dateLabel = formatCmsScheduleDisplayLabel(row.requestedDate!.trim())
      const unitLabel = formatCompanySchoolScheduleUnitLabel({
        sessionCount: sessionCount ?? undefined,
        startPeriod: startPeriod ?? undefined,
      })
      return {
        key: row.id != null ? String(row.id) : `hope-${index}`,
        preferenceOrder: positiveInteger(row.preferenceOrder),
        dateLabel,
        sessionCount,
        startPeriod,
        dateUnitSegments: [dateLabel, ...(unitLabel ? [unitLabel] : [])],
        periodTimeLabels,
      }
    })
}
