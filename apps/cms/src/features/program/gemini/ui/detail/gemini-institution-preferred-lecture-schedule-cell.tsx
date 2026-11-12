import { ScheduleLinesCell } from '@/features/program/shared/ui/schedule-lines-cell'
import './institution-application-tab.css'

/** 서버 문구 `2026. 11. 25(수)` → 표시 `2026.11.25(수)` (QA 2026-11-13 Gemini #14) */
function normalizeDotDate(value: string): string {
  return value.replace(
    /(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.?(?=\s*\(|\s|$)/g,
    (_, year: string, month: string, day: string) =>
      `${year}.${month.padStart(2, '0')}.${day.padStart(2, '0')}`
  )
}

function normalizeClockRange(value: string): string {
  return normalizeDotDate(value.replace(/\s*~\s*/g, ' ~ ')).trim()
}

/** `N지망 : 날짜 시각 | N차시` — 구포맷 `날짜 | 시각(N차시)` 도 허용 */
export function parsePreferredLectureScheduleLine(line: string): {
  preference: string
  datetime: string
  session: string
} | null {
  const trimmed = line.trim()
  if (!trimmed) return null

  const colonIndex = trimmed.indexOf(':')
  if (colonIndex === -1) {
    const datetime = normalizeClockRange(trimmed)
    return datetime ? { preference: '', datetime, session: '' } : null
  }

  const preference = trimmed.slice(0, colonIndex).trim()
  const rest = trimmed.slice(colonIndex + 1).trim()
  const pipeIndex = rest.lastIndexOf('|')
  if (pipeIndex === -1) {
    const datetime = normalizeClockRange(rest)
    if (!preference || !datetime) return null
    return { preference, datetime, session: '' }
  }

  let datetime = rest.slice(0, pipeIndex).trim()
  let session = rest.slice(pipeIndex + 1).trim()
  const embeddedSession = /^(.+?)\((\d+\s*차시)\)$/.exec(session)
  if (embeddedSession) {
    datetime = `${datetime} ${normalizeClockRange(embeddedSession[1] ?? '')}`.trim()
    session = (embeddedSession[2] ?? '').replace(/\s+/g, '')
  }
  datetime = normalizeClockRange(datetime)
  if (!preference || !datetime) return null
  return { preference, datetime, session }
}

/** 희망 강의 일정 — 공통 일정 셀 (최대 3줄·디바이더·블록 중앙) */
export function GeminiInstitutionPreferredLectureScheduleCell({ value }: { value: string }) {
  const lines = value
    .split('\n')
    .map(parsePreferredLectureScheduleLine)
    .filter((line): line is NonNullable<typeof line> => line != null)
    .map(line => {
      const datetimeLabel = line.preference
        ? `${line.preference} : ${line.datetime}`
        : line.datetime
      return line.session ? `${datetimeLabel} | ${line.session}` : datetimeLabel
    })
  return <ScheduleLinesCell lines={lines} />
}
