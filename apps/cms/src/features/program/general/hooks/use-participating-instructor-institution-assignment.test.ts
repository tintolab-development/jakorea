import { describe, expect, it } from 'vitest'
import type { InstructorAssignmentListItemEnriched } from '@/features/program/general/api/instructor-assignment-types'
import { selectAssignmentsForInstructor } from './use-participating-instructor-institution-assignment'

function assignment(
  overrides: Partial<InstructorAssignmentListItemEnriched> &
    Pick<InstructorAssignmentListItemEnriched, 'assignmentId' | 'instructorMemberId'>
): InstructorAssignmentListItemEnriched {
  return {
    programId: 186416,
    scheduleId: 187447,
    ...overrides,
  } as InstructorAssignmentListItemEnriched
}

describe('selectAssignmentsForInstructor', () => {
  it('memberId로만 필터하고 calendar 교차 없이 list assignment를 남긴다', () => {
    const rows = selectAssignmentsForInstructor(
      [
        assignment({ assignmentId: 1694870, instructorMemberId: 190076 }),
        assignment({ assignmentId: 1694871, instructorMemberId: 190076 }),
        assignment({ assignmentId: 1694872, instructorMemberId: 190076 }),
        assignment({ assignmentId: 999, instructorMemberId: 190001 }),
      ],
      '190076'
    )
    expect(rows.map(row => row.assignmentId)).toEqual([1694870, 1694871, 1694872])
  })

  it('participantId(1695005)를 memberId로 쓰면 매칭되지 않는다', () => {
    const rows = selectAssignmentsForInstructor(
      [assignment({ assignmentId: 1694870, instructorMemberId: 190076 })],
      '1695005'
    )
    expect(rows).toEqual([])
  })

  it('취소된 배정은 제외한다', () => {
    const rows = selectAssignmentsForInstructor(
      [
        assignment({
          assignmentId: 1,
          instructorMemberId: 190076,
          assignmentStatus: 'ASSIGNED',
        }),
        assignment({
          assignmentId: 2,
          instructorMemberId: 190076,
          assignmentStatus: 'CANCELLED',
        }),
      ],
      '190076'
    )
    expect(rows.map(row => row.assignmentId)).toEqual([1])
  })
})
