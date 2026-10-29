import { describe, expect, it } from 'vitest'
import { schoolRowNeedsScheduleHydration } from './organization-application-schedules-hydrate'
import type { ApplicantSchoolRow } from '@/features/program/shared/model/applicant-institution'

describe('schoolRowNeedsScheduleHydration', () => {
  it('does not hydrate when preferred hope sessions already have calendar dates', () => {
    const row = {
      id: '1691544',
      no: 1,
      schoolName: '기관 A',
      region: '서울',
      educationGrade: '1학년',
      classCount: 1,
      studentCount: 10,
      teacherName: '교사',
      approvalStatus: 'pending',
      programId: '186473',
      sessions: [
        {
          round: 1,
          date: '2026.12.14',
          dayOfWeek: '월',
          duration: '45분',
          format: '-',
          classNum: '1지망',
          timeRange: '09:00 ~ 09:45',
          startAt: '2026-12-14T00:00:00Z',
        },
      ],
    } as ApplicantSchoolRow
    expect(schoolRowNeedsScheduleHydration(row)).toBe(false)
  })

  it('hydrates when hope sessions are missing', () => {
    const row = {
      id: '1691545',
      no: 2,
      schoolName: '기관 B',
      region: '서울',
      educationGrade: '1학년',
      classCount: 1,
      studentCount: 10,
      teacherName: '교사',
      approvalStatus: 'pending',
      programId: '186473',
      sessions: [],
    } as ApplicantSchoolRow
    expect(schoolRowNeedsScheduleHydration(row)).toBe(true)
  })
})
