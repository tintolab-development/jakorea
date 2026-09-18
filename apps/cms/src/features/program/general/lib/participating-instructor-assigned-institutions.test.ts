import { describe, expect, it } from 'vitest'
import { buildAssignedOrganizationNamesByMemberId } from './participating-instructor-assigned-institutions'

describe('buildAssignedOrganizationNamesByMemberId', () => {
  it('강사 memberId별 배정 기관명을 가나다순으로 반환한다', () => {
    const map = buildAssignedOrganizationNamesByMemberId([
      {
        instructorMemberId: 9001,
        organizationName: '진월초등학교',
        assignmentStatus: 'ASSIGNED',
      },
      {
        instructorMemberId: 9001,
        organizationName: '강서초등학교',
        assignmentStatus: 'ASSIGNED',
      },
      {
        instructorMemberId: 9002,
        organizationName: '마포초등학교',
        assignmentStatus: 'CANCELLED',
      },
    ])

    expect(map.get('9001')).toEqual(['강서초등학교', '진월초등학교'])
    expect(map.has('9002')).toBe(false)
  })
})
