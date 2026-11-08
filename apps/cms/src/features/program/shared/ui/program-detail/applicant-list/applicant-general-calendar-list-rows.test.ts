import { describe, expect, it } from 'vitest'
import type { ApplicantInstructorRow } from '@/features/program/shared/model/applicant-instructor'
import type { ApplicantSchoolRow } from '@/features/program/shared/model/applicant-institution'
import type { ApplicantCalendarEvent } from './applicant-calendar-events'
import { buildGeneralInstructorCalendarListRows } from './applicant-general-calendar-list-rows'

const instructor = {
  id: 'inst-1',
  no: 1,
  instructorName: '한서연',
  lectureExperienceYears: 0,
  educationLevel: '',
  educationSchoolName: '',
  contact: '',
  email: '',
  address: '',
  approvalStatus: 'approved',
  // 신청 단위 거리 — 마지막 배정 기관 거리라 기관 카드에 쓰면 안 된다
  distanceKm: 77.7,
  organizationDistances: [
    { organizationApplicationId: 501, distanceKm: 12.3, longDistance: false },
    { organizationApplicationId: 502, distanceKm: 231.4, longDistance: true },
  ],
} as ApplicantInstructorRow

function eventFor(organizationApplicationId: string, schoolName: string): ApplicantCalendarEvent {
  return {
    id: `2026-11-20|${organizationApplicationId}|9001`,
    title: schoolName,
    startDate: '2026-11-20T00:00:00.000Z',
    endDate: '2026-11-20T01:00:00.000Z',
    originalItem: {
      ...instructor,
      calendarBucketSchoolName: schoolName,
      calendarInstitutionRow: { id: organizationApplicationId, schoolName } as ApplicantSchoolRow,
      calendarInstitutionInstructors: [instructor],
    },
  } as unknown as ApplicantCalendarEvent
}

describe('buildGeneralInstructorCalendarListRows 거리', () => {
  it('기관 카드마다 그 기관 신청까지의 거리를 쓴다', () => {
    const rows = buildGeneralInstructorCalendarListRows([
      eventFor('501', '계남중학교'),
      eventFor('502', '부명초등학교'),
    ])
    expect(rows.map(row => row.distanceDisplay)).toEqual(['12.3km', '231.4km (장거리)'])
    expect(rows[0]?.isNearDistance).toBe(true)
  })

  it('그 기관 거리가 없으면 신청 단위 거리로 대체하지 않는다', () => {
    const [row] = buildGeneralInstructorCalendarListRows([eventFor('999', '다른학교')])
    expect(row?.distanceKm).toBeNull()
    expect(row?.distanceDisplay).toBe('-')
  })
})
