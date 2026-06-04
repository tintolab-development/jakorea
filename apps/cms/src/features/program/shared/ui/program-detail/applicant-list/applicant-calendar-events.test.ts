import { describe, expect, it } from 'vitest'
import { mapApplicantDataToCalendarEvents } from './applicant-calendar-events'
import type { GeneralIndividualApplicantRow } from '@/data/mock/general-individual-applications-mock'
import type { ApplicantSchoolRow } from '@/data/mock/applicant-institutions'

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
})
