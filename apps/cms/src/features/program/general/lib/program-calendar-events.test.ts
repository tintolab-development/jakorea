import { describe, expect, it } from 'vitest'
import type { AdminProgramCalendarItem } from '@/features/program/general/api/program-calendar-api-client'
import {
  mapAdminProgramCalendarItemsToEvents,
  resolveProgramCalendarColorKey,
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
        startAt: null as unknown as undefined,
        endAt: null as unknown as undefined,
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
        eventDate: null as unknown as undefined,
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

  it('keeps EDUCATION_PERIOD as a single span and does not expand into daily EDUCATION', () => {
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

    expect(events).toHaveLength(1)
    expect(events[0]?.id).toBe('EDUCATION_PERIOD:187500:PROGRAM')
    expect(events[0]?.startDate).toBe('2026-04-03')
    expect(events[0]?.endDate).toBe('2026-11-20')
    expect(events[0]?.kind).toBe('education')
    expect(events[0]?.eventType).toBe('EDUCATION_PERIOD')
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
