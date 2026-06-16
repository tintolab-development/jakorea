import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import type { ApplicantInstructorRow } from '@/data/mock/applicant-instructors'
import type { ApplicantSchoolRow } from '@/data/mock/applicant-institutions'
import type { GeneralIndividualApplicantRow } from '@/data/mock/general-individual-applications-mock'
import type { ApprovalStatusKey } from '@/shared/components/approval-status-badge'
import type {
  CalendarGeneralInstitutionApplicationListRow,
  CalendarGeneralInstructorApplicationListRow,
  CalendarGeneralIndividualApplicationListRow,
} from '@/shared/components/calendar'
import {
  findInstitutionSessionForDate,
  formatInstitutionCalendarSessionTimeDisplay,
  getInstitutionRegionShort,
} from './applicant-institution-calendar-session'
import { getInstructorCalendarSessionCardLabel } from './applicant-instructor-calendar-session'
import {
  getInstructorScheduleDispatchStats,
  getInstructorScheduleDistanceKm,
  isInstructorNearDistanceKm,
} from './applicant-instructor-schedule-meta'
import type { ApplicantCalendarEvent } from './applicant-calendar-events'

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
    const session = findInstitutionSessionForDate(institution, dateKey)

    rows.push({
      id: selectionKey,
      colorKey: event.id,
      institutionName: institution.schoolName?.trim() || '기관',
      approvalStatus: approvalStatusModifier(
        institution.approvalStatus as ApprovalStatusKey | undefined
      ),
      regionLabel: getInstitutionRegionShort(institution.region),
      gradeLabel: institution.educationGrade?.trim() || '-',
      sessionLabel: formatInstitutionCalendarSessionTimeDisplay(
        session,
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
    const session = findInstitutionSessionForDate(applicant, dateKey)

    rows.push({
      id: selectionKey,
      colorKey: event.id,
      applicantName: applicant.applicantName.trim() || '참여자',
      approvalStatus: approvalStatusModifier(
        applicant.approvalStatus as ApprovalStatusKey | undefined
      ),
      regionLabel: getInstitutionRegionShort(applicant.homeAddress),
      gradeLabel: applicant.educationGrade?.trim() || '-',
      sessionLabel: formatInstitutionCalendarSessionTimeDisplay(session),
    })
  }

  return rows
}

function flattenInstructorCalendarCards(
  events: ApplicantCalendarEvent[]
): Array<{ id: string; colorKey: string | number; schoolName: string; instructor: ApplicantInstructorRow }> {
  const cards: Array<{
    id: string
    colorKey: string | number
    schoolName: string
    instructor: ApplicantInstructorRow
  }> = []

  for (const event of events) {
    const originalItem = event.originalItem as unknown as Record<string, unknown> | undefined
    if (!originalItem) continue
    const schoolName = String(originalItem.schoolName ?? '').trim() || '기관'
    const institutionRows = originalItem.calendarInstitutionInstructors as
      | ApplicantInstructorRow[]
      | undefined

    if (institutionRows?.length) {
      for (const inst of institutionRows) {
        cards.push({ id: String(inst.id), colorKey: event.id, schoolName, instructor: inst })
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

export function buildGeneralInstructorCalendarListRows(
  events: ApplicantCalendarEvent[]
): CalendarGeneralInstructorApplicationListRow[] {
  return flattenInstructorCalendarCards(events).map(({ id, colorKey, schoolName, instructor }) => {
    const instructorName = instructor.instructorName || '-'
    const sessionLabel = getInstructorCalendarSessionCardLabel(instructor, schoolName)
    const distanceKm = getInstructorScheduleDistanceKm(
      schoolName,
      instructorName,
      instructor.address
    )
    const { dispatchCount, longDistanceCount } = getInstructorScheduleDispatchStats(instructorName)

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
      isNearDistance: isInstructorNearDistanceKm(distanceKm),
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
