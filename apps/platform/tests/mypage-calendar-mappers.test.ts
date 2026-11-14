import { describe, expect, it } from 'vitest'
import {
  mapPortalScheduleItem,
  mapPortalScheduleItems,
  portalCalendarRange,
} from '../src/features/mypage/home/api/mappers'
import {
  formatPortalCalendarTimeRange,
  resolvePortalCalendarEventType,
} from '../src/features/mypage/home/lib/calendar-event-map'

describe('portal calendar event types', () => {
  it('keeps missing eventType as PROGRAM_SCHEDULE / education', () => {
    expect(resolvePortalCalendarEventType(undefined)).toEqual({ kind: 'legacy_education' })
    expect(resolvePortalCalendarEventType(null)).toEqual({ kind: 'legacy_education' })
    expect(resolvePortalCalendarEventType('')).toEqual({ kind: 'legacy_education' })
  })

  it('maps the six BE calendar eventTypes', () => {
    expect(resolvePortalCalendarEventType('PROGRAM_SCHEDULE')).toEqual({
      kind: 'mapped',
      type: 'education',
    })
    expect(resolvePortalCalendarEventType('ASSIGNMENT_DEADLINE')).toEqual({
      kind: 'mapped',
      type: 'assignment',
    })
    expect(resolvePortalCalendarEventType('SATISFACTION_DEADLINE')).toEqual({
      kind: 'mapped',
      type: 'satisfaction',
    })
    expect(resolvePortalCalendarEventType('SURVEY_DEADLINE')).toEqual({
      kind: 'mapped',
      type: 'survey',
    })
    expect(resolvePortalCalendarEventType('EXPENSE_RECEIPT_DEADLINE')).toEqual({
      kind: 'mapped',
      type: 'receipt',
    })
    expect(resolvePortalCalendarEventType('LECTURE_REPORT_DEADLINE')).toEqual({
      kind: 'mapped',
      type: 'lecture_report_deadline',
    })
  })

  it('still maps legacy lowercase FE types from older responses', () => {
    expect(resolvePortalCalendarEventType('education')).toEqual({ kind: 'mapped', type: 'education' })
    expect(resolvePortalCalendarEventType('assignment')).toEqual({ kind: 'mapped', type: 'assignment' })
  })

  it('does not coerce unknown eventType to education', () => {
    expect(resolvePortalCalendarEventType('HOLIDAY')).toEqual({ kind: 'unsupported' })
    expect(
      mapPortalScheduleItem({
        scheduleId: 1,
        eventType: 'HOLIDAY',
        startAt: '2026-11-05T09:00:00+09:00',
      }),
    ).toBeNull()
  })
})

describe('portal calendar time display', () => {
  it('shows TIME_PRESENT education clocks and never 종일', () => {
    expect(
      formatPortalCalendarTimeRange({
        allDay: false,
        timeAvailability: 'TIME_PRESENT',
        startAt: '2026-11-10T05:00:00Z',
        endAt: '2026-11-10T07:00:00Z',
      }),
    ).toEqual({ time: '14:00~16:00', allDayTimeConflict: false })
  })

  it('renders DATE_ONLY and allDay as 종일', () => {
    expect(
      formatPortalCalendarTimeRange({
        timeAvailability: 'DATE_ONLY',
        allDay: true,
        startAt: '2026-10-31T15:00:00Z',
        endAt: '2026-11-30T15:00:00Z',
      }),
    ).toEqual({ time: '종일', allDayTimeConflict: false })
  })

  it('does not invent clocks for SOURCE_TIME_NOT_AVAILABLE', () => {
    expect(
      formatPortalCalendarTimeRange({
        timeAvailability: 'SOURCE_TIME_NOT_AVAILABLE',
        startAt: '2026-11-05T00:00:00+09:00',
        endAt: '2026-11-05T23:59:00+09:00',
      }),
    ).toEqual({ time: '', allDayTimeConflict: false })
  })

  it('does not label date-only events as 종일 unless allDay or DATE_ONLY', () => {
    expect(formatPortalCalendarTimeRange({ startAt: '2026-11-05' })).toEqual({
      time: '',
      allDayTimeConflict: false,
    })
    expect(formatPortalCalendarTimeRange({ startAt: '2026-11-05', allDay: true })).toEqual({
      time: '종일',
      allDayTimeConflict: false,
    })
  })

  it('keeps a start-only clock and does not invent an end clock', () => {
    expect(
      formatPortalCalendarTimeRange({ startAt: '2026-11-05T14:00:00+09:00' }),
    ).toEqual({ time: '14:00', allDayTimeConflict: false })
  })

  it('records allDay vs clock conflict and still shows 종일', () => {
    expect(
      formatPortalCalendarTimeRange({
        allDay: true,
        startAt: '2026-11-05T09:00:00+09:00',
        endAt: '2026-11-05T10:00:00+09:00',
      }),
    ).toEqual({ time: '종일', allDayTimeConflict: true })
  })
})

describe('portalCalendarRange Instant', () => {
  it('sends KST month bounds as UTC Instants', () => {
    expect(portalCalendarRange(new Date(2026, 10, 15))).toEqual({
      from: '2026-10-31T15:00:00Z',
      to: '2026-11-30T15:00:00Z',
    })
  })
})

describe('mapPortalScheduleItem BE contract', () => {
  it('maps timed PROGRAM_SCHEDULE without coercing to all-day', () => {
    const education = mapPortalScheduleItem({
      eventId: 'PROGRAM_SCHEDULE:11',
      eventType: 'PROGRAM_SCHEDULE',
      scheduleId: 11,
      applicationId: 3,
      applicationType: 'INSTRUCTOR',
      title: '2회차',
      startAt: '2026-11-10T05:00:00Z',
      endAt: '2026-11-10T07:00:00Z',
      allDay: false,
      timeAvailability: 'TIME_PRESENT',
      status: 'SCHEDULED',
    })

    expect(education).toMatchObject({
      id: 'PROGRAM_SCHEDULE:11',
      type: 'education',
      title: '2회차',
      time: '14:00~16:00',
      startDate: '2026-11-10',
      endDate: '2026-11-10',
      allDay: false,
      applicationType: 'INSTRUCTOR',
      scheduleId: '11',
    })
  })

  it('does not render leftover PROGRAM_PERIOD from older backends', () => {
    expect(resolvePortalCalendarEventType('PROGRAM_PERIOD')).toEqual({ kind: 'unsupported' })
    expect(
      mapPortalScheduleItem({
        eventId: 'PROGRAM_PERIOD:100',
        eventType: 'PROGRAM_PERIOD',
        programId: 100,
        programTitle: '경제교육',
        allDay: true,
        timeAvailability: 'DATE_ONLY',
        startAt: '2026-10-31T15:00:00Z',
        endAt: '2026-11-30T15:00:00Z',
      }),
    ).toBeNull()
    expect(
      mapPortalScheduleItems([
        {
          eventId: 'PROGRAM_PERIOD:100',
          eventType: 'PROGRAM_PERIOD',
          startAt: '2026-10-31T15:00:00Z',
          endAt: '2026-11-30T15:00:00Z',
        },
        {
          eventId: 'PROGRAM_SCHEDULE:307',
          eventType: 'PROGRAM_SCHEDULE',
          scheduleId: 307,
          startAt: '2026-08-07T01:00:00Z',
          endAt: '2026-08-07T03:00:00Z',
          allDay: false,
          timeAvailability: 'TIME_PRESENT',
        },
      ]).map(item => item.id),
    ).toEqual(['PROGRAM_SCHEDULE:307'])
  })

  it('uses deadlineDate for lecture report and does not recompute Instant+23:59', () => {
    const deadline = mapPortalScheduleItem({
      eventId: 'LECTURE_REPORT_DEADLINE:10',
      eventType: 'LECTURE_REPORT_DEADLINE',
      assignmentId: 10,
      applicationId: 12,
      programTitle: '경제교육',
      allDay: true,
      timeAvailability: 'DATE_ONLY',
      deadlineDate: '2026-11-05',
      deadlineAt: '2026-11-05T15:00:00Z',
      startAt: '2026-11-05T15:00:00Z',
      reportStatus: 'AVAILABLE',
      status: 'NOT_SUBMITTED',
    })

    expect(deadline).toMatchObject({
      id: 'LECTURE_REPORT_DEADLINE:10',
      type: 'lecture_report_deadline',
      title: '강의보고서 제출 마감',
      applicationType: 'INSTRUCTOR',
      time: '종일',
      startDate: '2026-11-05',
      endDate: '2026-11-05',
      assignmentId: '10',
    })
  })

  it('falls back to deadlineAt then submitDueAt without inventing 익월 5일', () => {
    const fromDeadlineAt = mapPortalScheduleItem({
      eventId: 'LECTURE_REPORT_DEADLINE:11',
      eventType: 'LECTURE_REPORT_DEADLINE',
      assignmentId: 11,
      allDay: true,
      timeAvailability: 'DATE_ONLY',
      deadlineAt: '2026-10-15T14:59:59Z',
    })
    expect(fromDeadlineAt).toMatchObject({
      startDate: '2026-10-15',
      endDate: '2026-10-15',
    })

    const fromSubmitDueAt = mapPortalScheduleItem({
      eventId: 'LECTURE_REPORT_DEADLINE:12',
      eventType: 'LECTURE_REPORT_DEADLINE',
      assignmentId: 12,
      allDay: true,
      timeAvailability: 'DATE_ONLY',
      submitDueAt: '2026-10-15T14:59:59Z',
    })
    expect(fromSubmitDueAt).toMatchObject({
      startDate: '2026-10-15',
      endDate: '2026-10-15',
    })
  })

  it('keeps SUBMITTED deadline events', () => {
    const submitted = mapPortalScheduleItem({
      eventId: 'ASSIGNMENT_DEADLINE:9:INDIVIDUAL:501',
      eventType: 'ASSIGNMENT_DEADLINE',
      formBindingId: 9,
      applicationId: 501,
      applicationType: 'INDIVIDUAL',
      title: '과제 제출',
      deadlineDate: '2026-11-05',
      allDay: true,
      timeAvailability: 'DATE_ONLY',
      status: 'SUBMITTED',
    })

    expect(submitted).toMatchObject({
      id: 'ASSIGNMENT_DEADLINE:9:INDIVIDUAL:501',
      type: 'assignment',
      status: 'SUBMITTED',
      startDate: '2026-11-05',
    })
  })

  it('maps receipt, survey, and satisfaction as distinct types on the same day', () => {
    const sameDay = mapPortalScheduleItems([
      {
        eventId: 'PROGRAM_SCHEDULE:10',
        eventType: 'PROGRAM_SCHEDULE',
        scheduleId: 10,
        programTitle: '경제교육',
        scheduleName: '1회차',
        startAt: '2026-11-05T00:00:00+09:00',
        endAt: '2026-11-05T02:00:00+09:00',
        allDay: false,
        timeAvailability: 'TIME_PRESENT',
      },
      {
        eventId: 'LECTURE_REPORT_DEADLINE:10',
        eventType: 'LECTURE_REPORT_DEADLINE',
        assignmentId: 10,
        programTitle: '경제교육',
        deadlineDate: '2026-11-05',
        allDay: true,
        timeAvailability: 'DATE_ONLY',
      },
      {
        eventId: 'SURVEY_DEADLINE:2:INDIVIDUAL:1',
        eventType: 'SURVEY_DEADLINE',
        formBindingId: 2,
        applicationId: 1,
        applicationType: 'INDIVIDUAL',
        deadlineDate: '2026-11-05',
        allDay: true,
        timeAvailability: 'DATE_ONLY',
      },
      {
        eventId: 'SATISFACTION_DEADLINE:3:INDIVIDUAL:1',
        eventType: 'SATISFACTION_DEADLINE',
        formBindingId: 3,
        applicationId: 1,
        applicationType: 'INDIVIDUAL',
        deadlineDate: '2026-11-05',
        allDay: true,
        timeAvailability: 'DATE_ONLY',
      },
      {
        eventId: 'EXPENSE_RECEIPT_DEADLINE:INDIVIDUAL:1',
        eventType: 'EXPENSE_RECEIPT_DEADLINE',
        applicationId: 1,
        applicationType: 'INDIVIDUAL',
        deadlineDate: '2026-11-05',
        allDay: true,
        timeAvailability: 'DATE_ONLY',
      },
    ])

    expect(sameDay.map(item => item.id)).toEqual([
      'PROGRAM_SCHEDULE:10',
      'LECTURE_REPORT_DEADLINE:10',
      'SURVEY_DEADLINE:2:INDIVIDUAL:1',
      'SATISFACTION_DEADLINE:3:INDIVIDUAL:1',
      'EXPENSE_RECEIPT_DEADLINE:INDIVIDUAL:1',
    ])
    expect(sameDay.map(item => item.type)).toEqual([
      'education',
      'lecture_report_deadline',
      'survey',
      'satisfaction',
      'receipt',
    ])
  })

  it('does not drop DATE_ONLY education that has no clock', () => {
    const allDayEducation = mapPortalScheduleItem({
      eventId: 'PROGRAM_SCHEDULE:12',
      eventType: 'PROGRAM_SCHEDULE',
      scheduleId: 12,
      allDay: true,
      timeAvailability: 'DATE_ONLY',
      startAt: '2026-11-10T15:00:00Z',
      endAt: '2026-11-11T15:00:00Z',
    })

    expect(allDayEducation).toMatchObject({
      type: 'education',
      time: '종일',
      startDate: '2026-11-11',
      endDate: '2026-11-11',
    })
  })
})
