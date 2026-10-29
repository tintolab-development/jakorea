/**
 * 1사1교 기관 신청 상세 — 진행 희망 교육 일정 (Figma 4175:106433)
 * Admin requested-schedules 응답을 시안 표 구조(■ N지망 / 희망 교육일 및 차시 / N차시 희망 교육 시간)로 바꾼다.
 * 서버 순서를 그대로 쓰며 클라이언트 정렬을 하지 않는다.
 */
import { formatDateDotWithWeekday } from '@/shared/utils/date'
import type { RequestedScheduleResponse } from '@/shared/api/generated/dashboard/schemas/requestedScheduleResponse'

export type CompanySchoolScheduleTimeCell = {
  key: string
  label: string
  /** 값 세그먼트 — 화면에서 `|` 구분선으로 잇는다. 비어 있으면 '-' */
  segments: string[]
}

export type CompanySchoolScheduleBlock = {
  key: string
  rankLabel: string
  dateSegments: string[]
  /** 한 행에 최대 2칸 (시안: 2차시면 1차시 | 2차시 한 행) */
  timeRows: CompanySchoolScheduleTimeCell[][]
}

function toClockLabel(raw?: string | null): string | null {
  const match = raw?.trim().match(/^(\d{1,2}):(\d{2})/)
  return match ? `${match[1]!.padStart(2, '0')}:${match[2]}` : null
}

function positiveInt(value: number | null | undefined): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null
}

function buildTimeCells(schedule: RequestedScheduleResponse, blockKey: string) {
  const times = schedule.sessionTimes ?? []
  const count = Math.max(positiveInt(schedule.sessionCount) ?? 0, times.length)
  const cells: CompanySchoolScheduleTimeCell[] = []
  for (let index = 0; index < count; index += 1) {
    const time = times[index]
    const order = positiveInt(time?.sessionOrder) ?? index + 1
    const segments: string[] = []
    const period = positiveInt(time?.period)
    if (period != null) segments.push(`${period}교시`)
    const start = toClockLabel(time?.startTime)
    const end = toClockLabel(time?.endTime)
    if (start || end) segments.push(`${start ?? '-'} ~ ${end ?? '-'}`)
    cells.push({ key: `${blockKey}-t${index}`, label: `${order}차시 희망 교육 시간`, segments })
  }
  return cells
}

function chunkPairs<T>(items: readonly T[]): T[][] {
  const rows: T[][] = []
  for (let index = 0; index < items.length; index += 2) {
    rows.push(items.slice(index, index + 2))
  }
  return rows
}

export function buildCompanySchoolPreferredScheduleBlocks(
  schedules: readonly RequestedScheduleResponse[] | null | undefined
): CompanySchoolScheduleBlock[] {
  return (schedules ?? []).map((schedule, index) => {
    const key = `rank-${schedule.id ?? 'x'}-${index}`
    const rank = positiveInt(schedule.preferenceOrder) ?? index + 1
    const dateSegments: string[] = []
    const date = schedule.requestedDate?.trim() ? formatDateDotWithWeekday(schedule.requestedDate) : '-'
    if (date !== '-') dateSegments.push(date)
    const sessionCount = positiveInt(schedule.sessionCount) ?? (schedule.sessionTimes?.length || null)
    if (sessionCount != null) dateSegments.push(`${sessionCount}차시`)
    return {
      key,
      rankLabel: `■ ${rank}지망`,
      dateSegments,
      timeRows: chunkPairs(buildTimeCells(schedule, key)),
    }
  })
}

const MEMO_ENTRY_PATTERN = /^(\d{4}-\d{2}-\d{2})\s+(\d+)교시\/(\d+)차시\s*\[([^\]]*)\]$/
const MEMO_TIME_PATTERN = /^(\d+):(\d+):(\d{1,2}:\d{2})-(\d{1,2}:\d{2})$/

/**
 * 기관 상세 `requestedScheduleMemo` (서버 생성 문자열) → requested-schedules 형태.
 * 예: `2026-12-22 2교시/2차시 [1:2:03:00-04:00;2:3:04:00-05:00], 2026-12-30 …`
 * requested-schedules 응답이 비어 있을 때만 쓴다. 형식이 하나라도 다르면 [] (기존 표시 유지).
 * 서버 문자열 순서를 그대로 지망 순서로 쓴다.
 */
export function parseCompanySchoolRequestedScheduleMemo(
  memo: string | null | undefined
): RequestedScheduleResponse[] {
  const text = memo?.trim()
  if (!text) return []
  const entries = text.split(/,\s*(?=\d{4}-\d{2}-\d{2}\s)/)
  const out: RequestedScheduleResponse[] = []
  for (const [index, entry] of entries.entries()) {
    const match = entry.trim().match(MEMO_ENTRY_PATTERN)
    if (!match) return []
    const [, requestedDate, startPeriod, sessionCount, timesRaw] = match
    const sessionTimes: NonNullable<RequestedScheduleResponse['sessionTimes']> = []
    for (const token of timesRaw!.split(';').map(part => part.trim()).filter(Boolean)) {
      const timeMatch = token.match(MEMO_TIME_PATTERN)
      if (!timeMatch) return []
      sessionTimes.push({
        sessionOrder: Number(timeMatch[1]),
        period: Number(timeMatch[2]),
        startTime: timeMatch[3],
        endTime: timeMatch[4],
      })
    }
    out.push({
      preferenceOrder: index + 1,
      requestedDate,
      startPeriod: Number(startPeriod),
      sessionCount: Number(sessionCount),
      sessionTimes,
    })
  }
  return out
}
