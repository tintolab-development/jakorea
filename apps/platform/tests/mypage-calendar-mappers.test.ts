import { describe, expect, it } from 'vitest'
import { mapPortalScheduleItem, mapPortalScheduleItems } from '../src/features/mypage/home/api/mappers'
import {
  formatPortalCalendarTimeRange,
  resolvePortalCalendarEventType,
} from '../src/features/mypage/home/lib/calendar-event-map'

describe('portal calendar event types', () => {
  it('keeps missing eventType as legacy education', () => {
    expect(resolvePortalCalendarEventType(undefined)).toEqual({ kind: 'legacy_education' })
    expect(resolvePortalCalendarEventType('')).toEqual({ kind: 'legacy_education' })
  })

  it('maps the seven calendar types including lecture report deadline', () => {
    expect(resolvePortalCalendarEventType('education')).toEqual({ kind: 'mapped', type: 'education' })
    expect(resolvePortalCalendarEventType('PROGRAM')).toEqual({ kind: 'mapped', type: 'program' })
    expect(resolvePortalCalendarEventType('assignment')).toEqual({ kind: 'mapped', type: 'assignment' })
    expect(resolvePortalCalendarEventType('satisfaction')).toEqual({ kind: 'mapped', type: 'satisfaction' })
    expect(resolvePortalCalendarEventType('survey')).toEqual({ kind: 'mapped', type: 'survey' })
    expect(resolvePortalCalendarEventType('receipt')).toEqual({ kind: 'mapped', type: 'receipt' })
    expect(resolvePortalCalendarEventType('LECTURE_REPORT_DEADLINE')).toEqual({
      kind: 'mapped',
      type: 'lecture_report_deadline',
    })
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
  it('shows education clocks as HH:mm~HH:mm', () => {
    expect(
      formatPortalCalendarTimeRange({
        startAt: '2026-11-05T09:00:00+09:00',
        endAt: '2026-11-05T10:30:00+09:00',
      }),
    ).toEqual({ time: '09:00~10:30', allDayTimeConflict: false })
  })

  it('does not label date-only program events as 종일 unless allDay is true', () => {
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

  it('records allDay vs clock conflict and still shows the server clock', () => {
    expect(
      formatPortalCalendarTimeRange({
        allDay: true,
        startAt: '2026-11-05T09:00:00+09:00',
        endAt: '2026-11-05T10:00:00+09:00',
      }),
    ).toEqual({ time: '09:00~10:00', allDayTimeConflict: true })
  })

  it('converts UTC instants to KST dates across the month boundary', () => {
    const event = mapPortalScheduleItem({
      scheduleId: 8,
      eventType: 'education',
      startAt: '2026-10-31T15:30:00Z',
      endAt: '2026-10-31T16:00:00Z',
    })
    expect(event).toMatchObject({
      startDate: '2026-11-01',
      endDate: '2026-11-01',
      time: '00:30~01:00',
    })
  })
})

describe('mapPortalScheduleItem lecture report calendar', () => {
  it('keeps education events and prefixes ids by type', () => {
    const education = mapPortalScheduleItem({
      scheduleId: 10,
      applicationId: 501,
      applicationType: 'INDIVIDUAL',
      eventType: 'education',
      programId: 99,
      programTitle: '경제교육',
      scheduleName: '1회차',
      startAt: '2026-11-05T00:00:00+09:00',
      endAt: '2026-11-05T02:00:00+09:00',
    })

    expect(education).toMatchObject({
      id: 'education:10',
      type: 'education',
      title: '1회차',
      time: '00:00~02:00',
      startDate: '2026-11-05',
      applicationType: 'INDIVIDUAL',
    })
  })

  it('maps LECTURE_REPORT_DEADLINE without inventing a due date', () => {
    const deadline = mapPortalScheduleItem({
      scheduleId: 10,
      applicationId: 12,
      eventType: 'LECTURE_REPORT_DEADLINE',
      programId: 99,
      programTitle: '경제교육',
      scheduleName: '',
      startAt: '2026-11-05T15:00:00+09:00',
      endAt: '2026-11-05T15:00:00+09:00',
      allDay: true,
    })

    expect(deadline).toMatchObject({
      id: 'lecture_report_deadline:10',
      type: 'lecture_report_deadline',
      title: '강의보고서 제출 마감',
      applicationType: 'INSTRUCTOR',
      time: '15:00',
      startDate: '2026-11-05',
    })
  })

  it('uses the server scheduleName as the deadline label', () => {
    const named = mapPortalScheduleItem({
      scheduleId: 11,
      eventType: 'lecture_report_deadline',
      programTitle: '경제교육',
      scheduleName: '지연 제출 가능',
      startAt: '2026-11-06T00:00:00+09:00',
    })

    expect(named?.title).toBe('지연 제출 가능')
  })

  it('maps deadline events that only have eventId', () => {
    const deadline = mapPortalScheduleItem({
      eventId: 'lr-88',
      eventType: 'LECTURE_REPORT_DEADLINE',
      programTitle: '경제교육',
      startAt: '2026-11-05',
      allDay: true,
    })

    expect(deadline).toMatchObject({
      id: 'lecture_report_deadline:lr-88',
      type: 'lecture_report_deadline',
      time: '종일',
    })
  })

  it('keeps education and multiple deadline events on the same date', () => {
    const sameDay = mapPortalScheduleItems([
      {
        scheduleId: 10,
        eventType: 'education',
        programTitle: '경제교육',
        scheduleName: '1회차',
        startAt: '2026-11-05T00:00:00+09:00',
        endAt: '2026-11-05T02:00:00+09:00',
      },
      {
        scheduleId: 10,
        eventType: 'LECTURE_REPORT_DEADLINE',
        programTitle: '경제교육',
        startAt: '2026-11-05T15:00:00+09:00',
        allDay: true,
      },
      {
        scheduleId: 22,
        eventType: 'LECTURE_REPORT_DEADLINE',
        programTitle: '다른 강의',
        startAt: '2026-11-05T15:00:00+09:00',
        allDay: true,
      },
    ])

    expect(sameDay.map(item => item.id)).toEqual([
      'education:10',
      'lecture_report_deadline:10',
      'lecture_report_deadline:22',
    ])
  })

  it('maps the remaining activity types with fallback titles', () => {
    const mapped = mapPortalScheduleItems([
      {
        eventId: 1,
        eventType: 'assignment',
        programTitle: '경제교육',
        startAt: '2026-11-05T23:59:00+09:00',
      },
      {
        eventId: 2,
        eventType: 'survey',
        programTitle: '경제교육',
        startAt: '2026-11-05',
        allDay: true,
      },
      {
        eventId: 3,
        eventType: 'satisfaction',
        programTitle: '경제교육',
        startAt: '2026-11-06T18:00:00+09:00',
      },
      {
        eventId: 4,
        eventType: 'receipt',
        programTitle: '경제교육',
        startAt: '2026-11-07',
        allDay: true,
      },
      {
        scheduleId: 5,
        eventType: 'program',
        programTitle: '경제교육',
        startAt: '2026-11-01',
        endAt: '2026-11-30',
      },
    ])

    expect(mapped.map(item => [item.type, item.title, item.time])).toEqual([
      ['assignment', '과제 제출', '23:59'],
      ['survey', '설문조사', '종일'],
      ['satisfaction', '만족도조사', '18:00'],
      ['receipt', '영수증 신청 마감', '종일'],
      ['program', '프로그램 일정', ''],
    ])
  })
})
