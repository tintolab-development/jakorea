import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import type { ApplicantInstructorRow } from '@/features/program/shared/model/applicant-instructor'
import type { ApplicantSchoolRow } from '@/features/program/shared/model/applicant-institution'
import type { GeneralIndividualApplicantRow } from '@/features/program/general/model/individual-applicant'
import type { ApprovalStatusKey } from '@/shared/components/approval-status-badge'
import type {
  CalendarGeneralInstitutionApplicationListRow,
  CalendarGeneralInstructorApplicationListRow,
  CalendarGeneralIndividualApplicationListRow,
} from '@/shared/components/calendar'
import {
  findInstitutionSessionsForDate,
  formatInstitutionCalendarSessionsTimeDisplay,
  getInstitutionRegionShort,
} from './applicant-institution-calendar-session'
import { getInstructorCalendarSessionCardLabel } from './applicant-instructor-calendar-session'
import { formatApiDistanceKmDisplay } from '@/shared/lib/format-api-distance-km'
import { findWaitingOrganizationDistance } from '@/features/program/general/lib/assignment-waiting-distance'
import {
  getInstructorScheduleDispatchStats,
  getInstructorScheduleDistanceKm,
  isInstructorNearDistanceKm,
} from './applicant-instructor-schedule-meta'
import {
  resolveInstructorCalendarInstitutionName,
  type ApplicantCalendarEvent,
  type ApplicantInstructorCalendarEventItem,
} from './applicant-calendar-events'

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

function approvalStatusModifier(status: ApprovalStatusKey | undefined): ApprovalStatusKey {
  if (status === 'approved' || status === 'rejected' || status === 'pending') {
    return status
  }
  return 'pending'
}

export function buildGeneralInstitutionCalendarListRows(
  events: ApplicantCalendarEvent[]
): CalendarGeneralInstitutionApplicationListRow[] {
  const seen = new Set<string>()
  const rows: CalendarGeneralInstitutionApplicationListRow[] = []

  for (const event of events) {
    const institution = event.originalItem as ApplicantSchoolRow | undefined
    if (!institution) continue

    const selectionKey =
      typeof institution.id === 'string' && institution.id ? institution.id : String(event.id)
    if (seen.has(selectionKey)) continue
    seen.add(selectionKey)

    const dateKey = dayjs(event.startDate).format('YYYY-MM-DD')
    const sessions = findInstitutionSessionsForDate(institution, dateKey)

    rows.push({
      id: selectionKey,
      colorKey: event.id,
      institutionName: institution.schoolName?.trim() || '기관',
      approvalStatus: approvalStatusModifier(
        institution.approvalStatus as ApprovalStatusKey | undefined
      ),
      regionLabel: getInstitutionRegionShort(institution.region),
      gradeLabel: institution.educationGrade?.trim() || '-',
      sessionLabel: formatInstitutionCalendarSessionsTimeDisplay(
        sessions,
        institution.desiredEducationPeriod
      ),
    })
  }

  return rows
}

export function buildGeneralIndividualCalendarListRows(
  events: ApplicantCalendarEvent[]
): CalendarGeneralIndividualApplicationListRow[] {
  const seen = new Set<string>()
  const rows: CalendarGeneralIndividualApplicationListRow[] = []

  for (const event of events) {
    const applicant = event.originalItem as GeneralIndividualApplicantRow | undefined
    if (!applicant || typeof applicant.applicantName !== 'string') continue

    const selectionKey =
      typeof applicant.id === 'string' && applicant.id ? applicant.id : String(event.id)
    if (seen.has(selectionKey)) continue
    seen.add(selectionKey)

    const dateKey = dayjs(event.startDate).format('YYYY-MM-DD')
    const sessions = findInstitutionSessionsForDate(applicant, dateKey)

    rows.push({
      id: selectionKey,
      colorKey: event.id,
      applicantName: applicant.applicantName.trim() || '참여자',
      approvalStatus: approvalStatusModifier(
        applicant.approvalStatus as ApprovalStatusKey | undefined
      ),
      regionLabel: getInstitutionRegionShort(applicant.homeAddress),
      gradeLabel: applicant.educationGrade?.trim() || '-',
      sessionLabel: formatInstitutionCalendarSessionsTimeDisplay(sessions),
    })
  }

  return rows
}

type InstructorCalendarCard = {
  id: string
  colorKey: string | number
  schoolName: string
  /** 카드가 속한 기관 신청 id (기관별 거리 매칭) */
  organizationApplicationId?: string
  instructor: ApplicantInstructorRow
}

function flattenInstructorCalendarCards(events: ApplicantCalendarEvent[]): InstructorCalendarCard[] {
  const cards: InstructorCalendarCard[] = []

  for (const event of events) {
    const originalItem = event.originalItem as unknown as Record<string, unknown> | undefined
    if (!originalItem) continue
    const calendarItem = originalItem as unknown as ApplicantInstructorCalendarEventItem
    const schoolName = resolveInstructorCalendarInstitutionName(calendarItem)
    const organizationApplicationId = calendarItem.calendarInstitutionRow?.id?.trim() || undefined
    const institutionRows = originalItem.calendarInstitutionInstructors as
      | ApplicantInstructorRow[]
      | undefined

    if (institutionRows?.length) {
      for (const inst of institutionRows) {
        cards.push({
          id: String(inst.id),
          colorKey: event.id,
          schoolName,
          organizationApplicationId,
          instructor: inst,
        })
      }
      continue
    }

    if (typeof originalItem.instructorName === 'string') {
      cards.push({
        id: String(event.id),
        colorKey: event.id,
        schoolName,
        instructor: originalItem as unknown as ApplicantInstructorRow,
      })
    }
  }

  return cards
}

/**
 * 카드 거리 — 기관 카드면 강사 신청의 기관별 거리에서 그 기관 신청 id로 찾는다.
 * 신청 단위 distanceKm는 마지막 배정 기관 거리라 다른 기관 카드에 쓰지 않는다.
 */
function resolveInstructorCardDistance(card: InstructorCalendarCard): {
  distanceKm: number | null
  longDistance: boolean
} {
  const { instructor, organizationApplicationId } = card
  if (organizationApplicationId) {
    const hit = findWaitingOrganizationDistance(instructor.organizationDistances, {
      organizationApplicationId,
    })
    const km = hit?.distanceKm
    return {
      distanceKm: typeof km === 'number' && Number.isFinite(km) ? km : null,
      longDistance: hit?.longDistance === true,
    }
  }
  return {
    distanceKm: getInstructorScheduleDistanceKm(
      card.schoolName,
      instructor.instructorName || '-',
      instructor.address,
      instructor.distanceKm
    ),
    longDistance: instructor.longDistanceYn === true,
  }
}

export function buildGeneralInstructorCalendarListRows(
  events: ApplicantCalendarEvent[]
): CalendarGeneralInstructorApplicationListRow[] {
  return flattenInstructorCalendarCards(events).map(card => {
    const { id, colorKey, schoolName, instructor } = card
    const instructorName = instructor.instructorName || '-'
    const sessionLabel = getInstructorCalendarSessionCardLabel(instructor, schoolName)
    const { distanceKm, longDistance } = resolveInstructorCardDistance(card)
    const { dispatchCount, longDistanceCount } = getInstructorScheduleDispatchStats({
      programDispatchCount: instructor.programDispatchCount,
      programLongDistanceDispatchCount: instructor.programLongDistanceDispatchCount,
    })

    return {
      id,
      colorKey,
      schoolName,
      instructorName,
      approvalStatus: approvalStatusModifier(
        instructor.approvalStatus as ApprovalStatusKey | undefined
      ),
      sessionLabel,
      distanceKm,
      distanceDisplay: formatApiDistanceKmDisplay(distanceKm, { longDistance }),
      isNearDistance: distanceKm != null ? isInstructorNearDistanceKm(distanceKm) : false,
      dispatchCount,
      longDistanceCount,
    }
  })
}

export function filterApplicantCalendarEventsForDate(
  events: ApplicantCalendarEvent[],
  selectedDate: Dayjs
): ApplicantCalendarEvent[] {
  return events.filter(event => {
    const start = dayjs(event.startDate)
    const end = dayjs(event.endDate)
    return selectedDate.isSameOrAfter(start, 'day') && selectedDate.isSameOrBefore(end, 'day')
  })
}
