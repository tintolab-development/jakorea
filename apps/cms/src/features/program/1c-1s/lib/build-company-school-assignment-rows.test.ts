import { describe, expect, it } from 'vitest'
import {
  buildCompanySchoolAssignedInstructorRows,
  buildCompanySchoolWaitingInstructorRows,
} from './build-company-school-assignment-rows'

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
          requestedScheduleId: 12345,
          resolvedScheduleId: 9001,
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
    expect(rows[0]?.requestedScheduleId).toBe(12345)
  })

  it('resolvedScheduleId null이면 일정 미생성으로 unavailable', () => {
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
          requestedScheduleId: 99,
          resolvedScheduleId: null,
          scheduleUnresolved: true,
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
    })
    expect(rows[0]?.assignmentStatus).toBe('unavailable')
    expect(rows[0]?.scheduleUnresolved).toBe(true)
    expect(rows[0]?.hopeScheduleLine).toContain('일정 미생성')
  })
})

describe('buildCompanySchoolAssignedInstructorRows', () => {
  it('배정 응답의 organizationId를 그대로 전달한다', () => {
    const rows = buildCompanySchoolAssignedInstructorRows({
      organizationApplicationId: '9001',
      instructorNameByMemberId: new Map([['170024', '한서연']]),
      scheduleLabelById: new Map(),
      assignments: [
        {
          assignmentId: 1,
          organizationApplicationId: 9001,
          organizationId: 8801,
          organizationName: '인천가온고등학교',
          instructorMemberId: 170024,
          assignmentStatus: 'ASSIGNED',
          scheduleLead: true,
        },
        {
          assignmentId: 2,
          organizationApplicationId: 9001,
          organizationId: undefined,
          instructorMemberId: 170025,
          assignmentStatus: 'ASSIGNED',
        },
      ],
    })

    expect(rows).toHaveLength(2)
    expect(rows[0]?.organizationId).toBe(8801)
    expect(rows[0]?.organizationName).toBe('인천가온고등학교')
    expect(rows[1]?.organizationId).toBeUndefined()
  })
})
