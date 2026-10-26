import { describe, expect, it } from 'vitest'
import type { AdminProgramCalendarItem } from '@/features/program/general/api/program-calendar-api-client'
import { SCHEDULE_COLORS } from '@/features/program/shared/ui/program-schedule-colors'
import {
  mapAdminProgramCalendarItemsToEvents,
  resolveProgramCalendarColorKey,
  resolveProgramCalendarParticipantScope,
  resolveGeneralProgramMonthEventLabel,
  resolveProgramCalendarDisplayColors,
} from './program-calendar-events'

function item(overrides: AdminProgramCalendarItem): AdminProgramCalendarItem {
  return overrides
}

describe('mapAdminProgramCalendarItemsToEvents', () => {
  it('uses eventDate for all-day BUSINESS_START and does not shift to the UTC previous day', () => {
    const events = mapAdminProgramCalendarItemsToEvents([
      item({
        eventId: 'BUSINESS_START:186304',
        eventKey: 'BUSINESS_START:186304',
        programId: 186304,
        programName: '예시 프로그램',
        eventType: 'BUSINESS_START',
        scheduleName: '운영 시작',
        allDay: true,
        eventDate: '2026-10-01',
        colorKey: 'BUSINESS',
      }),
    ])

    expect(events).toHaveLength(1)
    expect(events[0]?.id).toBe('BUSINESS_START:186304')
    expect(events[0]?.startDate).toBe('2026-10-01')
    expect(events[0]?.endDate).toBe('2026-10-01')
    expect(events[0]?.startTime).toBeUndefined()
    expect(events[0]?.endTime).toBeUndefined()
    expect(events[0]?.timeLabel).toBe('종일')
    expect(events[0]?.scheduleContent).toBe('운영 시작')
  })

  it('treats a midnight BUSINESS_START as all-day even when BE sends allDay false', () => {
    const events = mapAdminProgramCalendarItemsToEvents([
      item({
        eventId: 'BUSINESS_START:186305',
        programId: 186305,
        programName: '자정 운영 시작 프로그램',
        eventType: 'BUSINESS_START',
        scheduleName: '운영 시작',
        allDay: false,
        startAt: '2026-10-24T15:00:00Z',
        endAt: '2026-10-24T15:00:00Z',
        colorKey: 'BUSINESS',
      }),
    ])

    expect(events[0]?.startDate).toBe('2026-10-25')
    expect(events[0]?.endDate).toBe('2026-10-25')
    expect(events[0]?.startTime).toBeUndefined()
    expect(events[0]?.endTime).toBeUndefined()
    expect(events[0]?.timeLabel).toBe('종일')
  })

  it('converts EDUCATION instants to Asia/Seoul clock without synthesizing 09:00', () => {
    const events = mapAdminProgramCalendarItemsToEvents([
      item({
        eventId: 'EDUCATION:187231:PROGRAM',
        programId: 186304,
        programName: '예시 프로그램',
        eventType: 'EDUCATION',
        scheduleName: '3회차 교육',
        sessionNo: 3,
        startAt: '2026-10-20T01:00:00Z',
        endAt: '2026-10-20T02:00:00Z',
        allDay: false,
        eventDate: null,
        colorKey: 'EDUCATION',
      }),
    ])

    expect(events).toHaveLength(1)
    expect(events[0]?.scheduleContent).toBe('3회차 교육')
    expect(events[0]?.startDate).toBe('2026-10-20T10:00:00')
    expect(events[0]?.endDate).toBe('2026-10-20T11:00:00')
    expect(events[0]?.startTime).toBe('10:00')
    expect(events[0]?.endTime).toBe('11:00')
    expect(events[0]?.timeLabel).toBe('10:00 ~ 11:00')
  })

  it('drops EDUCATION_PERIOD so it never renders as a session card', () => {
    const events = mapAdminProgramCalendarItemsToEvents([
      item({
        eventId: 'EDUCATION_PERIOD:187500:PROGRAM',
        programId: 186500,
        programName: '기간만 있는 프로그램',
        eventType: 'EDUCATION_PERIOD',
        scheduleName: '교육 진행 기간',
        allDay: true,
        eventDate: '2026-04-03',
        startAt: '2026-04-02T15:00:00Z',
        endAt: '2026-11-20T15:00:00Z',
        colorKey: 'EDUCATION',
      }),
    ])

    expect(events).toEqual([])
  })

  it('drops a multi-day allDay EDUCATION period window instead of expanding daily 24h cards', () => {
    const events = mapAdminProgramCalendarItemsToEvents([
      item({
        eventId: 'EDUCATION:187204:PROGRAM',
        scheduleId: 187204,
        programId: 186301,
        eventType: 'EDUCATION',
        allDay: true,
        eventDate: '2026-10-01',
        startAt: '2026-09-30T15:00:00Z',
        endAt: '2026-12-01T15:00:00Z',
      }),
    ])

    expect(events).toEqual([])
  })

  it('keeps a single-day allDay EDUCATION on eventDate (Asia/Seoul)', () => {
    const events = mapAdminProgramCalendarItemsToEvents([
      item({
        eventId: 'EDUCATION:1:PROGRAM',
        programId: 1,
        eventType: 'EDUCATION',
        allDay: true,
        eventDate: '2026-10-24',
        startAt: '2026-10-23T15:00:00Z',
        endAt: '2026-10-24T15:00:00Z',
      }),
    ])

    expect(events).toHaveLength(1)
    expect(events[0]?.startDate).toBe('2026-10-24')
    expect(events[0]?.endDate).toBe('2026-10-24')
  })

  it('186339: keeps 5 timed sessions on 2026-10-24 KST separately and drops 187270 period row', () => {
    const base = {
      programId: 186339,
      programName: '개커복날 강사테슽',
      programType: 'GENERAL_INDIVIDUAL',
      eventType: 'EDUCATION',
      allDay: false,
      eventDate: null,
      organizationName: null,
    } satisfies AdminProgramCalendarItem
    const timed = (scheduleId: number, startAt: string, endAt: string) =>
      item({
        ...base,
        scheduleId,
        eventId: `EDUCATION:${scheduleId}:PROGRAM`,
        eventKey: `EDUCATION:${scheduleId}:PROGRAM`,
        startAt,
        endAt,
      })
    const events = mapAdminProgramCalendarItemsToEvents([
      item({
        ...base,
        scheduleId: 187270,
        eventId: 'EDUCATION:187270:PROGRAM',
        scheduleName: '커리큘럼 기간',
        allDay: true,
        eventDate: '2026-10-24',
        startAt: '2026-10-23T15:00:00Z',
        endAt: '2026-12-24T15:00:00Z',
      }),
      timed(187271, '2026-10-24T07:00:00Z', '2026-10-24T07:02:00Z'),
      timed(187272, '2026-10-24T07:05:00Z', '2026-10-24T07:06:00Z'),
      timed(187273, '2026-10-24T07:10:00Z', '2026-10-24T07:11:00Z'),
      timed(187274, '2026-10-24T07:35:00Z', '2026-10-24T07:36:00Z'),
      timed(187310, '2026-10-24T01:00:00Z', '2026-10-24T03:00:00Z'),
    ])

    expect(events.map(event => event.scheduleId)).toEqual([187310, 187271, 187272, 187273, 187274])
    expect(events.every(event => event.startDate.startsWith('2026-10-24T'))).toBe(true)
    expect(events.map(event => `${event.startTime}-${event.endTime}`)).toEqual([
      '10:00-12:00',
      '16:00-16:02',
      '16:05-16:06',
      '16:10-16:11',
      '16:35-16:36',
    ])
    expect(events.some(event => event.scheduleId === 187270)).toBe(false)
    expect(events.every(event => event.participantScope === 'individual')).toBe(true)
  })

  it('buckets timed events by Asia/Seoul date, not the UTC ISO date', () => {
    const events = mapAdminProgramCalendarItemsToEvents([
      item({
        eventId: 'EDUCATION:IAC:185744',
        eventType: 'EDUCATION',
        programId: 186317,
        startAt: '2026-09-08T00:00:00Z',
        endAt: '2026-09-08T03:00:00Z',
        allDay: false,
        eventDate: null,
      }),
      item({
        eventId: 'EDUCATION:2:PROGRAM',
        eventType: 'EDUCATION',
        programId: 2,
        startAt: '2026-10-23T16:30:00Z',
        endAt: '2026-10-23T17:30:00Z',
        allDay: false,
        eventDate: null,
      }),
    ])

    const byId = new Map(events.map(event => [event.id, event]))
    expect(byId.get('EDUCATION:IAC:185744')?.startDate).toBe('2026-09-08T09:00:00')
    expect(byId.get('EDUCATION:2:PROGRAM')?.startDate).toBe('2026-10-24T01:30:00')
    expect(byId.get('EDUCATION:2:PROGRAM')?.startTime).toBe('01:30')
  })

  it('keeps events with the same scheduleId but different eventId (org / instructor assignments)', () => {
    const events = mapAdminProgramCalendarItemsToEvents([
      item({
        eventId: 'EDUCATION:1411:41',
        eventType: 'EDUCATION',
        programId: 1,
        programType: 'GENERAL_ORGANIZATION',
        scheduleId: 1411,
        organizationName: '서울초등학교',
        scheduleName: '1회차 교육',
        startAt: '2026-10-20T01:00:00Z',
        endAt: '2026-10-20T02:00:00Z',
        allDay: false,
      }),
      item({
        eventId: 'EDUCATION:1411:42',
        eventType: 'EDUCATION',
        programId: 1,
        programType: 'GENERAL_ORGANIZATION',
        scheduleId: 1411,
        organizationName: '부산중학교',
        scheduleName: '1회차 교육',
        startAt: '2026-10-20T01:00:00Z',
        endAt: '2026-10-20T02:00:00Z',
        allDay: false,
      }),
    ])

    expect(events.map(event => event.id)).toEqual(['EDUCATION:1411:41', 'EDUCATION:1411:42'])
    expect(events.map(event => event.scheduleContent)).toEqual([
      '서울초등학교 1회차 교육',
      '부산중학교 1회차 교육',
    ])
    expect(events.map(event => event.title)).toEqual([
      '서울초등학교 1회차 교육',
      '부산중학교 1회차 교육',
    ])
    expect(events.every(event => event.participantScope === 'organization')).toBe(true)
  })

  it('maps company-school IAC events without filtering by assignmentStatus', () => {
    const events = mapAdminProgramCalendarItemsToEvents([
      item({
        eventId: 'EDUCATION:IAC:185744',
        eventKey: 'EDUCATION:IAC:185744',
        eventType: 'EDUCATION',
        sourceType: 'INSTRUCTOR_ASSIGNMENT_CALENDAR',
        scheduleId: 187239,
        programId: 186317,
        programType: 'COMPANY_SCHOOL',
        organizationName: 'GROK_E2E_CS_학교A',
        startAt: '2026-09-08T00:00:00Z',
        endAt: '2026-09-08T03:00:00Z',
        allDay: false,
        eventDate: null,
      }),
      item({
        eventId: 'EDUCATION:IAC:185745',
        eventType: 'EDUCATION',
        sourceType: 'INSTRUCTOR_ASSIGNMENT_CALENDAR',
        scheduleId: 187239,
        programId: 186317,
        programType: 'COMPANY_SCHOOL',
        organizationName: 'GROK_E2E_CS_학교A',
        startAt: '2026-09-08T00:00:00Z',
        endAt: '2026-09-08T03:00:00Z',
        allDay: false,
        eventDate: null,
      }),
    ])

    expect(events).toHaveLength(2)
    expect(events[0]?.scheduleContent).toBe('GROK_E2E_CS_학교A')
    expect(events[0]?.scheduleId).toBe(187239)
    expect(events[0]?.sourceType).toBe('INSTRUCTOR_ASSIGNMENT_CALENDAR')
    expect(events[0]?.participantScope).toBeUndefined()
  })

  it('collapses only exact duplicate eventId rows', () => {
    const row = item({
      eventId: 'EDUCATION:9:PROGRAM',
      eventType: 'EDUCATION',
      programId: 9,
      startAt: '2026-10-20T01:00:00Z',
      endAt: '2026-10-20T02:00:00Z',
      allDay: false,
    })
    expect(mapAdminProgramCalendarItemsToEvents([row, { ...row }])).toHaveLength(1)
  })

  it('keeps a milestone with a non-midnight KST clock as a timed card', () => {
    const events = mapAdminProgramCalendarItemsToEvents([
      item({
        eventId: 'RECRUITMENT_START:5',
        programId: 5,
        programName: 'SAP-함께 성장하JA!',
        eventType: 'RECRUITMENT_START',
        scheduleName: '참여자 모집 시작',
        allDay: false,
        startAt: '2026-11-09T05:00:00Z',
        endAt: '2026-11-09T06:00:00Z',
      }),
    ])

    expect(events[0]?.startTime).toBe('14:00')
    expect(events[0]?.endTime).toBe('15:00')
    expect(events[0]?.timeLabel).toBe('14:00 ~ 15:00')
    expect(events[0]?.scheduleContent).toBe('참여자 모집 시작')
  })

  it('uses the program name as the week grid card title for education and all-day milestones alike', () => {
    const events = mapAdminProgramCalendarItemsToEvents([
      item({
        eventId: 'EDUCATION:1:PROGRAM',
        programId: 1,
        programName: '디즈니가 후원하는 청소년 콘텐츠 역량 강화 교육',
        eventType: 'EDUCATION',
        scheduleName: '1회차 교육',
        startAt: '2026-11-09T01:00:00Z',
        endAt: '2026-11-09T03:00:00Z',
        allDay: false,
      }),
      item({
        eventId: 'BUSINESS_START:1',
        programId: 1,
        programName: '디즈니가 후원하는 청소년 콘텐츠 역량 강화 교육',
        eventType: 'BUSINESS_START',
        scheduleName: '운영 시작',
        allDay: true,
        eventDate: '2026-11-09',
      }),
    ])
    const byId = new Map(events.map(event => [event.id, event]))
    expect(byId.get('EDUCATION:1:PROGRAM')?.timeGridLabel).toBe(
      '디즈니가 후원하는 청소년 콘텐츠 역량 강화 교육'
    )
    expect(byId.get('BUSINESS_START:1')?.timeGridLabel).toBe(
      '디즈니가 후원하는 청소년 콘텐츠 역량 강화 교육'
    )
    // 우측 목록·Hover용 일정명은 유지
    expect(byId.get('BUSINESS_START:1')?.scheduleContent).toBe('운영 시작')
    expect(byId.get('BUSINESS_START:1')?.title).toBe('운영 시작')
  })

  it('returns [] for an empty response without synthesizing fallback events', () => {
    expect(mapAdminProgramCalendarItemsToEvents([])).toEqual([])
  })

  it('treats stored programType GENERAL as individual', () => {
    expect(resolveProgramCalendarParticipantScope('GENERAL')).toBe('individual')
    expect(resolveProgramCalendarParticipantScope('GENERAL_INDIVIDUAL')).toBe('individual')
    expect(resolveProgramCalendarParticipantScope('GENERAL_ORGANIZATION')).toBe('organization')
    expect(resolveProgramCalendarParticipantScope('TRAINED_TEACHER')).toBeUndefined()
  })

  it('keeps recruitment end and education session as two events on the same day', () => {
    const events = mapAdminProgramCalendarItemsToEvents([
      item({
        eventId: 'RECRUITMENT_END:1',
        programId: 1,
        programName: '동시 일정',
        eventType: 'RECRUITMENT_END',
        scheduleName: '참여자 모집 종료',
        allDay: true,
        eventDate: '2026-10-20',
        colorKey: 'RECRUITMENT',
      }),
      item({
        eventId: 'EDUCATION:2:PROGRAM',
        programId: 1,
        programName: '동시 일정',
        eventType: 'EDUCATION',
        scheduleName: '1회차 교육',
        startAt: '2026-10-20T01:00:00Z',
        endAt: '2026-10-20T02:00:00Z',
        allDay: false,
        colorKey: 'EDUCATION',
      }),
    ])

    expect(events.map(event => event.id)).toEqual(['RECRUITMENT_END:1', 'EDUCATION:2:PROGRAM'])
  })

  it('uses organizationName only from the API scheduleName and does not parse educationScheduleLines', () => {
    const events = mapAdminProgramCalendarItemsToEvents([
      item({
        eventId: 'EDUCATION:187300:12',
        programId: 186400,
        programName: '1사1교 예시',
        programType: 'COMPANY_SCHOOL',
        eventType: 'EDUCATION',
        scheduleName: '예시초등학교 1회차 교육',
        organizationName: '예시초등학교',
        sessionNo: 1,
        startAt: '2026-10-15T00:00:00Z',
        endAt: '2026-10-15T03:00:00Z',
        allDay: false,
        colorKey: 'EDUCATION',
      }),
    ])

    expect(events[0]?.scheduleContent).toBe('예시초등학교 1회차 교육')
    expect(events[0]?.originalItem.id).toBe('186400')
  })

  it('copies periodStatus onto the stub so in-progress calendar clicks match the list entry', () => {
    const events = mapAdminProgramCalendarItemsToEvents([
      item({
        eventId: 'EDUCATION:187231:PROGRAM',
        programId: 186304,
        programName: '진행 중 프로그램',
        eventType: 'EDUCATION',
        periodStatus: 'IN_PROGRESS',
        startAt: '2026-10-20T01:00:00Z',
        endAt: '2026-10-20T02:00:00Z',
        allDay: false,
        colorKey: 'EDUCATION',
      }),
    ])

    expect(events[0]?.originalItem.lifecycleStatus).toBe('in_progress')
  })
})

describe('resolveGeneralProgramMonthEventLabel', () => {
  it('shows the program name first in month cells, schedule name only as fallback', () => {
    expect(
      resolveGeneralProgramMonthEventLabel({ programTitle: '지급조서테스트', scheduleContent: '운영 시작' })
    ).toBe('지급조서테스트')
    expect(
      resolveGeneralProgramMonthEventLabel({ programTitle: '  ', scheduleContent: '운영 시작' })
    ).toBe('운영 시작')
    expect(resolveGeneralProgramMonthEventLabel(null, '원본 제목')).toBe('원본 제목')
  })
})

describe('resolveProgramCalendarDisplayColors', () => {
  it('uses the program search color map, not event-type colorKey', () => {
    const yellow = SCHEDULE_COLORS[4]
    const green = SCHEDULE_COLORS[0]
    const map = new Map([['p-yellow', yellow]])

    expect(resolveProgramCalendarDisplayColors('p-yellow', map)).toBe(yellow)
    expect(resolveProgramCalendarDisplayColors('p-other', map)).not.toBe(yellow)
    expect(resolveProgramCalendarDisplayColors(undefined, map)).toBe(green)
  })
})

describe('programOperationStartDate', () => {
  it('copies BUSINESS_START date onto other events of the same program', () => {
    const events = mapAdminProgramCalendarItemsToEvents([
      item({
        eventId: 'EDUCATION:1:PROGRAM',
        programId: 10,
        programName: '노란 기간',
        eventType: 'EDUCATION',
        scheduleName: '1회차 교육',
        allDay: false,
        startAt: '2026-12-01T01:00:00Z',
        endAt: '2026-12-01T02:00:00Z',
        colorKey: 'EDUCATION',
      }),
      item({
        eventId: 'BUSINESS_START:10',
        programId: 10,
        programName: '노란 기간',
        eventType: 'BUSINESS_START',
        scheduleName: '운영 시작',
        allDay: true,
        eventDate: '2026-01-15',
        colorKey: 'BUSINESS',
      }),
    ])

    expect(events.find(event => event.id === 'EDUCATION:1:PROGRAM')?.programOperationStartDate).toBe(
      '2026-01-15'
    )
  })
})

describe('resolveProgramCalendarColorKey', () => {
  it('prefers colorKey and otherwise derives from eventType', () => {
    expect(resolveProgramCalendarColorKey({ colorKey: 'SURVEY', eventType: 'EDUCATION' })).toBe(
      'SURVEY'
    )
    expect(resolveProgramCalendarColorKey({ eventType: 'BUSINESS_END' })).toBe('BUSINESS')
    expect(resolveProgramCalendarColorKey({ eventType: 'EDUCATION_PERIOD' })).toBe('EDUCATION')
  })
})
