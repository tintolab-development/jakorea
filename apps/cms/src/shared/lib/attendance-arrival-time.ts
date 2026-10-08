/**
 * 출석 `arrivalTime` — 서버는 ISO-8601 시간(`HH:mm` / `HH:mm:ss`, 두 자리)만 받는다.
 * 화면은 `H:mm`(예: `9:05`) 표기를 쓰므로 전송 직전·응답 수신 시 변환한다.
 */

export const ATTENDANCE_ARRIVAL_TIME_FORMAT_ERROR_MESSAGE =
  '도착 시간을 HH:mm 형식으로 입력해 주세요.'

export class InvalidAttendanceArrivalTimeError extends Error {
  constructor(value: string) {
    super(`Invalid arrival time: ${value}`)
    this.name = 'InvalidAttendanceArrivalTimeError'
  }
}

const TIME_PATTERN = /^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/

function parseTimeParts(value: string): { hh: number; mm: number; ss: number | null } | null {
  const match = TIME_PATTERN.exec(value)
  if (!match) return null
  const hh = Number(match[1])
  const mm = Number(match[2])
  const ss = match[3] == null ? null : Number(match[3])
  if (hh > 23 || mm > 59 || (ss != null && ss > 59)) return null
  return { hh, mm, ss }
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

/** 전송용 — 빈 값은 null, 형식 오류는 `InvalidAttendanceArrivalTimeError` */
export function toIsoLocalTime(value: string | null | undefined): string | null {
  if (value == null) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  const parts = parseTimeParts(trimmed)
  if (!parts) throw new InvalidAttendanceArrivalTimeError(value)
  const { hh, mm, ss } = parts
  return ss == null ? `${pad2(hh)}:${pad2(mm)}` : `${pad2(hh)}:${pad2(mm)}:${pad2(ss)}`
}

/** 표시용 — 응답 `09:10:30` → `9:10`. 해석 불가 값은 원문 유지 */
export function formatArrivalTimeForDisplay(value: string | null | undefined): string | undefined {
  if (value == null) return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const parts = parseTimeParts(trimmed)
  if (!parts) return trimmed
  return `${parts.hh}:${pad2(parts.mm)}`
}

export function isInvalidAttendanceArrivalTimeError(
  error: unknown
): error is InvalidAttendanceArrivalTimeError {
  return error instanceof InvalidAttendanceArrivalTimeError
}
