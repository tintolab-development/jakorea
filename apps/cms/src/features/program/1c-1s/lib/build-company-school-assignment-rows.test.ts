import { describe, expect, it } from 'vitest'
import { buildCompanySchoolWaitingInstructorRows } from './build-company-school-assignment-rows'

describe('buildCompanySchoolWaitingInstructorRows', () => {
  it('희망일(session)이 없으면 행을 만들지 않는다 (가짜 일정 금지)', () => {
    const rows = buildCompanySchoolWaitingInstructorRows({
      schoolName: '인천가온고등학교',
      sessions: [],
      approvedInstructors: [
        {
          id: 1,
          instructorMemberId: 170024,
          instructorName: '한서연',
          applicationStatus: 'APPROVED',
          distanceKm: 45,
        },
      ],
      assignedInstructorMemberIds: new Set(),
    })
    expect(rows).toEqual([])
  })

  it('점유일에 걸리면 unavailable', () => {
    const occupied = new Map<string, Set<string>>([['170024', new Set(['2026-09-12'])]])
    const rows = buildCompanySchoolWaitingInstructorRows({
      schoolName: '인천가온고등학교',
      sessions: [
        {
          round: 1,
          date: '2026. 09. 12',
          dayOfWeek: '금',
          duration: '1차시',
          format: '단독',
          classNum: '1교시',
          timeRange: '1교시',
          status: 'pending',
        },
      ],
      approvedInstructors: [
        {
          id: 1,
          instructorMemberId: 170024,
          instructorName: '한서연',
          applicationStatus: 'APPROVED',
        },
      ],
      assignedInstructorMemberIds: new Set(),
      occupiedLectureDatesByInstructorId: occupied,
    })
    expect(rows).toHaveLength(1)
    expect(rows[0]?.assignmentStatus).toBe('unavailable')
  })
})
