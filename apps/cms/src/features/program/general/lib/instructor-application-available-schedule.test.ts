import { describe, expect, it, vi } from 'vitest'

const mockApprovedSlots = vi.hoisted(() => [
  {
    key: 'applicant-school-1|2026-04-15|1',
    dateKey: '2026-04-15',
    schoolId: 'applicant-school-1',
    schoolName: '진월초등학교',
    region: '광주',
    sessionRound: 1,
    sessionLabel: '1차시',
    timeRange: '09:00 - 10:00',
    assignedCount: 0,
  },
])

vi.mock('./instructor-lecture-assign-schedule', () => ({
  getApprovedInstitutionLectureScheduleSlots: (programId: string) =>
    programId === 'general-prog-scheduled-1' ? mockApprovedSlots : [],
  parseIndividualInstructorLectureAssignSchedule: vi.fn(() => []),
}))

import { buildInstructorAvailableScheduleSlots } from './instructor-application-available-schedule'

describe('buildInstructorAvailableScheduleSlots', () => {
  it('승인된 기관의 희망 일정만 노출한다', () => {
    const slots = buildInstructorAvailableScheduleSlots('general-prog-scheduled-1')
    expect(slots.length).toBeGreaterThan(0)
    expect(slots.every(s => s.id && s.dateKey && s.school)).toBe(true)
    expect(slots.some(s => s.school === '진월초등학교')).toBe(true)
  })

  it('승인되지 않은 기관 일정은 노출하지 않는다', () => {
    const slots = buildInstructorAvailableScheduleSlots('general-prog-scheduled-1')
    expect(slots.some(s => s.id.startsWith('applicant-school-2|'))).toBe(false)
  })
})
