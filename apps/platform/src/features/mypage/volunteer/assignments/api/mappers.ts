import type {
  VolunteerAssignmentBundle,
  VolunteerAssignmentStatus,
  VolunteerAssignedInstitutionRow,
  VolunteerAssignedScheduleRow,
  VolunteerWaitingInstitutionRow,
  VolunteerWaitingScheduleRow,
} from '../model/types'
import { formatVolunteerDistanceKm } from '../lib/format-distance'
import { normalizeScheduleDisplayLabel } from '@/shared/lib/format-display-date'
import {
  formatVolunteerScheduleLine,
  isRoundWithinLastSession,
  legacyRoundNumberFromScheduleLine,
  positiveVolunteerSessionNo,
  stripServerRoundTail,
} from '../lib/status'
import type {
  PortalVolunteerAssignedItem,
  PortalVolunteerAssignmentsResponse,
  PortalVolunteerWaitingItem,
} from './client'

function renumber<T extends { no: number }>(rows: T[]): T[] {
  return rows.map((row, index) => ({ ...row, no: rows.length - index }))
}

function mapStatus(value: string | undefined): VolunteerAssignmentStatus | null {
  const code = (value ?? '').trim().toUpperCase()
  if (code === 'WAITING' || code === '배정 대기') return 'waiting'
  if (code === 'CANCELLED' || code === 'CANCELED' || code === '배정 취소') return 'cancelled'
  return null
}

type VolunteerScheduleEntry = {
  /** 화면 라벨 — 서버 꼬리 `| N차시`(회차 번호)를 떼고 회차를 알면 `| N회차` */
  line: string
  /** 활동 포기 필터용 회차. null이면 숨기지 않는다 */
  sessionNo: number | null
}

/**
 * 서버 라벨 1줄 → 화면 라벨·회차.
 * - 새 응답(sessionNo 키 있음): 회차 = sessionNo. 라벨 숫자를 읽지 않는다.
 * - 구버전 응답(키 없음): 필터는 기존처럼 라벨 꼬리 숫자(서버가 회차 번호를 붙인 값)로 하되,
 *   화면에는 그 꼬리를 「N차시」로 보여 주지 않는다.
 */
function toScheduleEntry(
  line: string,
  sessionNo: { present: true; value: unknown } | { present: false },
): VolunteerScheduleEntry | null {
  if (!line) return null
  if (sessionNo.present) {
    const round = positiveVolunteerSessionNo(sessionNo.value)
    const display = formatVolunteerScheduleLine(line, round)
    return display ? { line: display, sessionNo: round } : null
  }
  const display = stripServerRoundTail(line)
  return display ? { line: display, sessionNo: legacyRoundNumberFromScheduleLine(line) } : null
}

/** 배정 행 일정 줄. sessionNos는 scheduleLines와 같은 순서·길이(N6). 길이가 다르면 구버전처럼 처리한다. */
function readAssignedScheduleEntries(item: PortalVolunteerAssignedItem): VolunteerScheduleEntry[] {
  const rawLines =
    Array.isArray(item.scheduleLines) && item.scheduleLines.length > 0
      ? item.scheduleLines
      : item.scheduleLine?.trim()
        ? [item.scheduleLine]
        : []
  const sessionNos =
    Array.isArray(item.sessionNos) && item.sessionNos.length === rawLines.length
      ? item.sessionNos
      : null
  return rawLines.flatMap((raw, index) => {
    const entry = toScheduleEntry(
      normalizeScheduleDisplayLabel(String(raw ?? '').trim()),
      sessionNos ? { present: true, value: sessionNos[index] } : { present: false },
    )
    return entry ? [entry] : []
  })
}

function filterAssignedLines(item: PortalVolunteerAssignedItem, lastSession?: number): string[] {
  return readAssignedScheduleEntries(item)
    .filter(entry => isRoundWithinLastSession(entry.sessionNo, lastSession))
    .map(entry => entry.line)
}

/** 대기·취소 행 일정 1줄. 회차는 sessionNo(N6), 키가 없으면 구버전 처리 */
function readWaitingScheduleEntry(item: PortalVolunteerWaitingItem): VolunteerScheduleEntry | null {
  const scheduleLine = item.scheduleLine?.trim() ?? ''
  return toScheduleEntry(
    scheduleLine,
    Object.prototype.hasOwnProperty.call(item, 'sessionNo')
      ? { present: true, value: item.sessionNo }
      : { present: false },
  )
}

function mapIndividualAssigned(
  items: PortalVolunteerAssignedItem[],
  lastSession?: number,
): VolunteerAssignedScheduleRow[] {
  const rows = items.flatMap((item, index) => {
    const scheduleLines = filterAssignedLines(item, lastSession)
    if (scheduleLines.length === 0) return []
    const location = item.locationName?.trim() || item.region?.trim() || '-'
    return [
      {
        id: String(item.id ?? item.scheduleId ?? `assigned-${index}`),
        no: 0,
        location,
        distanceFromHome: formatVolunteerDistanceKm(item.distanceKm, {
          longDistance: item.longDistance,
        }),
        scheduleLines,
      },
    ]
  })
  return renumber(rows)
}

function mapIndividualWaiting(
  items: PortalVolunteerWaitingItem[],
  lastSession?: number,
): VolunteerWaitingScheduleRow[] {
  const rows = items.flatMap((item, index) => {
    const entry = readWaitingScheduleEntry(item)
    if (!entry) return []
    if (!isRoundWithinLastSession(entry.sessionNo, lastSession)) return []
    const scheduleLine = entry.line
    const status = mapStatus(item.assignmentStatus)
    if (!status) return []
    const location = item.locationName?.trim() || item.region?.trim() || '-'
    return [
      {
        id: String(item.id ?? item.scheduleId ?? `waiting-${index}`),
        no: 0,
        location,
        distanceFromHome: formatVolunteerDistanceKm(item.distanceKm, {
          longDistance: item.longDistance,
        }),
        scheduleLine,
        assignmentStatus: status,
      },
    ]
  })
  return renumber(rows)
}

function mapOrgAssigned(
  items: PortalVolunteerAssignedItem[],
  lastSession?: number,
): VolunteerAssignedInstitutionRow[] {
  const rows = items.flatMap((item, index) => {
    const scheduleLines = filterAssignedLines(item, lastSession)
    if (scheduleLines.length === 0) return []
    return [
      {
        id: String(item.id ?? item.scheduleId ?? `org-assigned-${index}`),
        no: 0,
        schoolName: item.schoolName?.trim() || '-',
        educationGrade: item.educationGrade?.trim() || '-',
        region: item.region?.trim() || item.locationName?.trim() || '-',
        distanceFromHome: formatVolunteerDistanceKm(item.distanceKm, {
          longDistance: item.longDistance,
        }),
        scheduleLines,
      },
    ]
  })
  return renumber(rows)
}

function mapOrgWaiting(
  items: PortalVolunteerWaitingItem[],
  lastSession?: number,
): VolunteerWaitingInstitutionRow[] {
  const rows = items.flatMap((item, index) => {
    const entry = readWaitingScheduleEntry(item)
    if (!entry) return []
    if (!isRoundWithinLastSession(entry.sessionNo, lastSession)) return []
    const scheduleLine = entry.line
    const status = mapStatus(item.assignmentStatus)
    if (!status) return []
    return [
      {
        id: String(item.id ?? item.scheduleId ?? `org-waiting-${index}`),
        no: 0,
        schoolName: item.schoolName?.trim() || '-',
        desiredGrade: item.desiredGrade?.trim() || '-',
        region: item.region?.trim() || item.locationName?.trim() || '-',
        distanceFromHome: formatVolunteerDistanceKm(item.distanceKm, {
          longDistance: item.longDistance,
        }),
        scheduleLine,
        assignmentStatus: status,
      },
    ]
  })
  return renumber(rows)
}

export function mapPortalVolunteerAssignments(
  response: PortalVolunteerAssignmentsResponse,
  fallbackAudience: 'individual' | 'organization',
  lastParticipatedSession?: number,
): VolunteerAssignmentBundle {
  const audienceRaw = (response.programAudience ?? fallbackAudience).toString().toLowerCase()
  const audience = audienceRaw === 'organization' ? 'organization' : 'individual'
  const assigned = response.assigned ?? []
  const waiting = response.waiting ?? []

  if (audience === 'organization') {
    return {
      audience: 'organization',
      data: {
        assigned: mapOrgAssigned(assigned, lastParticipatedSession),
        waiting: mapOrgWaiting(waiting, lastParticipatedSession),
      },
    }
  }

  return {
    audience: 'individual',
    data: {
      assigned: mapIndividualAssigned(assigned, lastParticipatedSession),
      waiting: mapIndividualWaiting(waiting, lastParticipatedSession),
    },
  }
}
