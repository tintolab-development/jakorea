import type { VolunteerAssignmentStatus } from '../model/types'

export const VOLUNTEER_ASSIGNMENT_STATUS_LABEL: Record<VolunteerAssignmentStatus, string> = {
  waiting: '배정 대기',
  cancelled: '배정 취소',
}

/**
 * 서버 일정 라벨 끝의 `| N차시`.
 * 백엔드 라벨은 아직 회차 번호(session_no)에 「차시」를 붙인 값이다(N6 — 라벨 변경은 FE 전환 후 별도).
 * 화면에는 이 꼬리를 그대로 보여 주지 않는다.
 */
const SERVER_ROUND_TAIL_RE = /\s*\|\s*(\d+)\s*차시\s*$/u

/** 회차 번호(sessionNo). 양의 정수만 — 사전교육·회차 없음(null)·0은 null */
export function positiveVolunteerSessionNo(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null
}

/** 라벨 끝 `| N차시`(실제로는 회차 번호)를 뗀다 */
export function stripServerRoundTail(line: string): string {
  return line.replace(SERVER_ROUND_TAIL_RE, '').trim()
}

/**
 * 구버전 응답(sessionNo·sessionNos 키 없음) 전용 — 라벨 꼬리 `| N차시`의 N을 회차 번호로 읽는다.
 * 새 응답에서는 쓰지 않는다(sessionNo·sessionNos가 SSOT).
 */
export function legacyRoundNumberFromScheduleLine(line: string): number | null {
  const match = SERVER_ROUND_TAIL_RE.exec(line)
  return positiveVolunteerSessionNo(match ? Number(match[1]) : null)
}

/**
 * 화면 일정 라벨 — 서버 꼬리 `| N차시`를 떼고, 회차를 알면 `| N회차`로 붙인다.
 * 회차가 없으면(사전교육 등) 꼬리 없이 일시만.
 */
export function formatVolunteerScheduleLine(line: string, sessionNo: number | null): string {
  const base = stripServerRoundTail(line)
  if (!base) return ''
  return sessionNo != null ? `${base} | ${sessionNo}회차` : base
}

/**
 * 활동 포기 이후 일정 숨김 — 회차(sessionNo)를 마지막 참여 회차와 비교한다.
 * 회차가 없는 일정(사전교육 등 null)은 숨기지 않는다.
 */
export function isRoundWithinLastSession(sessionNo: number | null, lastSession?: number): boolean {
  if (lastSession == null) return true
  if (sessionNo == null) return true
  return sessionNo <= lastSession
}
