import type { VolunteerAssignmentStatus } from '../model/types'

export const VOLUNTEER_ASSIGNMENT_STATUS_LABEL: Record<VolunteerAssignmentStatus, string> = {
  waiting: '배정 대기',
  cancelled: '배정 취소',
}

export function sessionNumberFromScheduleLine(line: string): number | null {
  const match = line.match(/(\d+)\s*차시/)
  if (!match) return null
  return Number.parseInt(match[1] ?? '', 10)
}

export function isScheduleLineWithinLastSession(line: string, lastSession?: number): boolean {
  if (lastSession == null) return true
  const session = sessionNumberFromScheduleLine(line)
  if (session == null) return true
  return session <= lastSession
}
