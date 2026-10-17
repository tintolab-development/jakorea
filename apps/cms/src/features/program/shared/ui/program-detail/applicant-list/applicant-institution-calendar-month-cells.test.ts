import { describe, expect, it } from 'vitest'
import type { CalendarItem } from '@/shared/components/calendar/lib/calendar-helpers'
import { CALENDAR_ITEM_TYPE } from '@/shared/components/calendar/model/calendar-item'
import type { ApplicantSchoolRow } from '@/features/program/shared/model/applicant-institution'
import { buildGeneralInstitutionCalendarMonthCellRows } from './applicant-institution-calendar-month-cells'
import {
  formatInstitutionCalendarHoverMetaLine,
  formatInstitutionCalendarSessionTimesCommaList,
} from './applicant-institution-calendar-session'

function calendarItemForInstitution(
  institution: ApplicantSchoolRow,
  eventId: string,
  startDate: string
): CalendarItem {
  return {
    id: eventId,
    title: `[참여기관] ${institution.schoolName}`,
    startDate,
    endDate: startDate,
    type: CALENDAR_ITEM_TYPE,
    original: {
      id: eventId,
      title: `[참여기관] ${institution.schoolName}`,
      startDate,
      endDate: startDate,
      originalItem: institution,
    },
  }
}

describe('buildGeneralInstitutionCalendarMonthCellRows', () => {
  it('groups multiple session events for the same institution into one strip row', () => {
    const institution: ApplicantSchoolRow = {
      id: 'org-1',
      no: 1,
      schoolName: '부명초등학교',
      region: '인천광역시',
      educationGrade: '3학년',
      classCount: 1,
      studentCount: 20,
      teacherName: '김',
      approvalStatus: 'approved',
      sessions: [
        {
          round: 1,
          date: '2026.06.13',
          dayOfWeek: '금',
          duration: '1',
          format: '오프라인',
          classNum: '1차시',
          timeRange: '10:20~11:20',
          status: 'pending',
        },
        {
          round: 2,
          date: '2026.06.13',
          dayOfWeek: '금',
          duration: '1',
          format: '오프라인',
          classNum: '2차시',
          timeRange: '14:20~16:20',
          status: 'pending',
        },
      ],
    }

    const items = [
      calendarItemForInstitution(institution, 'org-1__2026-06-13__1', '2026-06-13T10:20:00'),
      calendarItemForInstitution(institution, 'org-1__2026-06-13__2', '2026-06-13T14:20:00'),
    ]

    const rows = buildGeneralInstitutionCalendarMonthCellRows(items)
    expect(rows).toHaveLength(1)
    expect(rows[0]?.id).toBe('org-1')
  })
})

describe('formatInstitutionCalendarSessionTimesCommaList', () => {
  it('joins session time ranges with commas', () => {
    const line = formatInstitutionCalendarSessionTimesCommaList([
      {
        round: 1,
        date: '2026.06.13',
        dayOfWeek: '금',
        duration: '1',
        format: '오프라인',
        classNum: '1차시',
        timeRange: '10:20~11:20',
        status: 'pending',
      },
      {
        round: 2,
        date: '2026.06.13',
        dayOfWeek: '금',
        duration: '1',
        format: '오프라인',
        classNum: '2차시',
        timeRange: '14:20~16:20',
        status: 'pending',
      },
    ])
    expect(line).toBe('10:20 ~ 11:20, 14:20 ~ 16:20')
  })

  it('builds hover meta line with region, grade, and times', () => {
    const meta = formatInstitutionCalendarHoverMetaLine(
      { region: '인천광역시 남동구', educationGrade: '3학년' },
      [
        {
          round: 1,
          date: '2026.06.13',
          dayOfWeek: '금',
          duration: '1',
          format: '오프라인',
          classNum: '1차시',
          timeRange: '10:20~11:20',
          status: 'pending',
        },
        {
          round: 2,
          date: '2026.06.13',
          dayOfWeek: '금',
          duration: '1',
          format: '오프라인',
          classNum: '2차시',
          timeRange: '14:20~16:20',
          status: 'pending',
        },
      ]
    )
    expect(meta).toBe('인천광역시 | 3학년 | 10:20 ~ 11:20, 14:20 ~ 16:20')
  })
})
