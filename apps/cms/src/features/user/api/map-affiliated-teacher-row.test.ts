import { describe, expect, it } from 'vitest'
import { mapAffiliatedTeacherRow } from './map-affiliated-teacher-row'
import { getMemberIdByUuid } from './member-id-registry'

describe('mapAffiliatedTeacherRow', () => {
  it('memberId로 이동 식별자를 채운다', () => {
    const row = mapAffiliatedTeacherRow({
      memberId: 42,
      uuid: 'teacher-uuid',
      name: '김교사',
      assignedGrade: '1학년',
      phone: '010-1111-2222',
      email: 'teacher@example.com',
      employmentStatus: 'ACTIVE',
    })

    expect(row.teacherMemberId).toBe(42)
    expect(row.linkedUserId).toBe('teacher-uuid')
    expect(getMemberIdByUuid('teacher-uuid')).toBe(42)
  })
})
