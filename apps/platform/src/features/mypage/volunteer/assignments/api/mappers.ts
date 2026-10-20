import type {
  VolunteerAssignmentBundle,
  VolunteerAssignmentStatus,
  VolunteerAssignedInstitutionRow,
  VolunteerAssignedScheduleRow,
  VolunteerWaitingInstitutionRow,
  VolunteerWaitingScheduleRow,
} from '../model/types'
import { formatVolunteerDistanceKm } from '../lib/format-distance'
import { normalizeScheduleDisplayLabel } from '../../../../../shared/lib/format-display-date.ts'
import { isScheduleLineWithinLastSession } from '../lib/status'
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

function readScheduleLines(item: PortalVolunteerAssignedItem): string[] {
  if (Array.isArray(item.scheduleLines) && item.scheduleLines.length > 0) {
    return item.scheduleLines.map(line => normalizeScheduleDisplayLabel(line.trim())).filter(Boolean)
  }
  const single = item.scheduleLine?.trim()
  return single ? [normalizeScheduleDisplayLabel(single)] : []
}

function filterAssignedLines(lines: string[], lastSession?: number): string[] {
  return lines.filter(line => isScheduleLineWithinLastSession(line, lastSession))
}

function mapIndividualAssigned(
  items: PortalVolunteerAssignedItem[],
  lastSession?: number,
): VolunteerAssignedScheduleRow[] {
  const rows = items.flatMap((item, index) => {
    const scheduleLines = filterAssignedLines(readScheduleLines(item), lastSession)
    if (scheduleLines.length === 0) return []
    const location = item.locationName?.trim() || item.region?.trim() || '-'
    return [
      {
        id: String(item.id ?? item.scheduleId ?? `assigned-${index}`),
        no: 0,
        location,
        distanceFromHome: formatVolunteerDistanceKm(item.distanceKm),
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
    const scheduleLine = item.scheduleLine?.trim()
    if (!scheduleLine) return []
    if (!isScheduleLineWithinLastSession(scheduleLine, lastSession)) return []
    const status = mapStatus(item.assignmentStatus)
    if (!status) return []
    const location = item.locationName?.trim() || item.region?.trim() || '-'
    return [
      {
        id: String(item.id ?? item.scheduleId ?? `waiting-${index}`),
        no: 0,
        location,
        distanceFromHome: formatVolunteerDistanceKm(item.distanceKm),
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
    const scheduleLines = filterAssignedLines(readScheduleLines(item), lastSession)
    if (scheduleLines.length === 0) return []
    return [
      {
        id: String(item.id ?? item.scheduleId ?? `org-assigned-${index}`),
        no: 0,
        schoolName: item.schoolName?.trim() || '-',
        educationGrade: item.educationGrade?.trim() || '-',
        region: item.region?.trim() || item.locationName?.trim() || '-',
        distanceFromHome: formatVolunteerDistanceKm(item.distanceKm),
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
    const scheduleLine = item.scheduleLine?.trim()
    if (!scheduleLine) return []
    if (!isScheduleLineWithinLastSession(scheduleLine, lastSession)) return []
    const status = mapStatus(item.assignmentStatus)
    if (!status) return []
    return [
      {
        id: String(item.id ?? item.scheduleId ?? `org-waiting-${index}`),
        no: 0,
        schoolName: item.schoolName?.trim() || '-',
        desiredGrade: item.desiredGrade?.trim() || '-',
        region: item.region?.trim() || item.locationName?.trim() || '-',
        distanceFromHome: formatVolunteerDistanceKm(item.distanceKm),
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
