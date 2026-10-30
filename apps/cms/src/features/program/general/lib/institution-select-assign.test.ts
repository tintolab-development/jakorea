import { describe, expect, it } from 'vitest'
import type { InstructorAssignmentListItemEnriched } from '@/features/program/general/api/instructor-assignment-types'
import type { Program } from '@/types/domain'
import {
  countAssignedInstructorsForOrganization,
  formatAssignedInstructorCountLine,
  resolveRequiredAssignableInstructorCount,
} from './institution-select-assign'

function assignment(
  patch: Partial<InstructorAssignmentListItemEnriched>
): InstructorAssignmentListItemEnriched {
  return patch as InstructorAssignmentListItemEnriched
}

describe('countAssignedInstructorsForOrganization', () => {
  it('보드 미로딩이면 null', () => {
    expect(
      countAssignedInstructorsForOrganization({
        assignments: [],
        boardLoaded: false,
        organizationApplicationId: '10',
      })
    ).toBeNull()
  })

  it('취소 건을 제외하고 강사 memberId 기준으로 센다', () => {
    expect(
      countAssignedInstructorsForOrganization({
        boardLoaded: true,
        organizationApplicationId: '10',
        assignments: [
          assignment({
            organizationApplicationId: 10,
            instructorMemberId: 1,
            assignmentStatus: 'ASSIGNED',
          }),
          assignment({
            organizationApplicationId: 10,
            instructorMemberId: 1,
            assignmentStatus: 'ASSIGNED',
          }),
          assignment({
            organizationApplicationId: 10,
            instructorMemberId: 2,
            assignmentStatus: 'CANCELLED',
          }),
          assignment({
            organizationApplicationId: 11,
            instructorMemberId: 3,
            assignmentStatus: 'ASSIGNED',
          }),
        ],
      })
    ).toBe(1)
  })

  it('해당 기관에 배정이 없으면 0', () => {
    expect(
      countAssignedInstructorsForOrganization({
        boardLoaded: true,
        organizationApplicationId: '10',
        assignments: [
          assignment({
            organizationApplicationId: 11,
            instructorMemberId: 3,
            assignmentStatus: 'ASSIGNED',
          }),
        ],
      })
    ).toBe(0)
  })
})

describe('formatAssignedInstructorCountLine', () => {
  it('양쪽 값이 있을 때만 문구를 만든다', () => {
    expect(formatAssignedInstructorCountLine(3, 4)).toBe('(현재 배정 인원 : 3/4명)')
    expect(formatAssignedInstructorCountLine(null, 4)).toBeNull()
    expect(formatAssignedInstructorCountLine(0, null)).toBeNull()
  })
})

describe('resolveRequiredAssignableInstructorCount', () => {
  it('모집 정원이 없으면 기본값을 만들지 않는다', () => {
    expect(resolveRequiredAssignableInstructorCount({} as Program)).toBeNull()
    expect(
      resolveRequiredAssignableInstructorCount({
        generalCommonInfo: { participantRecruitmentInfo: { maxAssignableInstructors: 4 } },
      } as Program)
    ).toBe(4)
  })
})
