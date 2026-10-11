import { describe, expect, it } from 'vitest'
import { mapRequestedSchedulesToSessions } from '@/features/program/1c-1s/lib/map-requested-schedules'
import { applyRequestedSchedulesToApplicantSchoolRow } from '@/features/program/general/api/adapters/general-applications-adapters'
import { mapApplicantDataToCalendarEvents } from './applicant-calendar-events'
import type { GeneralIndividualApplicantRow } from '@/features/program/general/model/individual-applicant'
import type { ApplicantSchoolRow } from '@/features/program/shared/model/applicant-institution'

describe('mapApplicantDataToCalendarEvents', () => {
  it('maps individual applications from sessions', () => {
    const row: GeneralIndividualApplicantRow = {
      id: 'ind-1',
      no: 1,
      applicantName: '홍길동',
      affiliation: '강서초',
      educationGrade: '5학년',
      homeAddress: '서울',
      approvalStatus: 'pending',
      sessions: [
        {
          round: 1,
          date: '2026.06.05',
          dayOfWeek: '금',
          duration: '2시간',
          format: '오프라인',
          classNum: '1교시',
          timeRange: '09:20~11:10',
          status: 'pending',
        },
      ],
    }
    const events = mapApplicantDataToCalendarEvents([row], 'individual-applications')
    expect(events).toHaveLength(1)
    expect(events[0]?.startDate).toBe('2026-06-05T09:20:00')
    expect(events[0]?.title).toContain('홍길동')
  })

  it('maps institution applications from sessions', () => {
    const row: ApplicantSchoolRow = {
      id: 'sch-1',
      no: 1,
      schoolName: '마포초등학교',
      region: '서울',
      educationGrade: '3학년',
      classCount: 2,
      studentCount: 40,
      teacherName: '김교사',
      approvalStatus: 'pending',
      sessions: [
        {
          round: 1,
          date: '2026.06.08',
          dayOfWeek: '월',
          duration: '1시간',
          format: '오프라인',
          classNum: '2교시',
          timeRange: '10:00~11:00',
          status: 'pending',
        },
      ],
    }
    const events = mapApplicantDataToCalendarEvents([row], 'institutions')
    expect(events).toHaveLength(1)
    expect(events[0]?.startDate).toBe('2026-06-08T10:00:00')
    expect(events[0]?.title).toContain('마포초등학교')
  })

  it('maps individual applications from scheduleLabel when date is unresolved', () => {
    const row: GeneralIndividualApplicantRow = {
      id: 'ind-label',
      no: 1,
      applicantName: '김서연',
      affiliation: '테스트초',
      educationGrade: '',
      homeAddress: '서울',
      approvalStatus: 'pending',
      sessions: [
        {
          round: 1,
          date: '-',
          dayOfWeek: '-',
          duration: '-',
          format: '-',
          classNum: '1지망',
          timeRange: '-',
          status: 'pending',
          scheduleLabel: '26년 10월 26일(월) 13:30 ~ 15:30',
          scheduleUnresolved: true,
        },
        {
          round: 2,
          date: '-',
          dayOfWeek: '-',
          duration: '-',
          format: '-',
          classNum: '2지망',
          timeRange: '-',
          status: 'pending',
          scheduleLabel: '26년 11월 2일(월) 13:30 ~ 15:30',
          scheduleUnresolved: true,
        },
      ],
    }
    const events = mapApplicantDataToCalendarEvents([row], 'individual-applications')
    expect(events).toHaveLength(2)
    expect(events.map(e => e.startDate.slice(0, 10)).sort()).toEqual(['2026-10-26', '2026-11-02'])
  })

  it('maps institution applications from requested-schedules hybrid rows', () => {
    const requested = [
      {
        id: 184839,
        preferenceOrder: 1,
        requestedDate: '2026-10-26',
        startPeriod: 1,
        sessionCount: 1,
        combinedClassYn: false,
        sessionTimes: [
          {
            sessionOrder: 1,
            period: 1,
            startTime: '10:00:00',
            endTime: '12:00:00',
          },
        ],
        resolvedScheduleId: null,
        label: '26년 10월 26일(월) 10:00 ~ 12:00',
      },
      {
        id: 184840,
        preferenceOrder: 1,
        requestedDate: '2026-11-02',
        startPeriod: 1,
        sessionCount: 1,
        combinedClassYn: false,
        sessionTimes: [
          {
            sessionOrder: 1,
            period: 1,
            startTime: '13:30:00',
            endTime: '16:00:00',
          },
        ],
        resolvedScheduleId: null,
        label: '26년 11월 2일(월) 13:30 ~ 16:00',
      },
    ]
    const base: ApplicantSchoolRow = {
      id: 'org-1',
      no: 1,
      schoolName: '서울공항초등학교',
      region: '서울',
      educationGrade: '1학년',
      classCount: 1,
      studentCount: 33,
      teacherName: '김',
      approvalStatus: 'pending',
      sessions: [],
    }
    const row = applyRequestedSchedulesToApplicantSchoolRow(base, requested as never)
    const events = mapApplicantDataToCalendarEvents([row], 'institutions')
    expect(events.map(e => e.startDate.slice(0, 10)).sort()).toEqual(['2026-10-26', '2026-11-02'])
    expect(mapRequestedSchedulesToSessions(requested as never)?.[0]?.scheduleLabel).toContain(
      '10:00'
    )
  })

  it('maps institution applications from scheduleLabel when date is unresolved', () => {
    const row: ApplicantSchoolRow = {
      id: 'sch-label',
      no: 1,
      schoolName: '마포초등학교',
      region: '서울',
      educationGrade: '3학년',
      classCount: 2,
      studentCount: 40,
      teacherName: '김교사',
      approvalStatus: 'pending',
      sessions: [
        {
          round: 1,
          date: '-',
          dayOfWeek: '-',
          duration: '-',
          format: '-',
          classNum: '1지망',
          timeRange: '-',
          status: 'pending',
          scheduleLabel: '26년 10월 28일(수) 09:00 ~ 11:00',
          scheduleUnresolved: true,
        },
      ],
    }
    const events = mapApplicantDataToCalendarEvents([row], 'institutions')
    expect(events).toHaveLength(1)
    expect(events[0]?.startDate).toBe('2026-10-28T09:00:00')
  })
})
