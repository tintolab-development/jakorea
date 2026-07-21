import { describe, expect, it } from 'vitest'
import { mapAffiliatedTeacherRow } from './map-affiliated-teacher-row'
import { getMemberIdByUuid } from './member-id-registry'

describe('mapAffiliatedTeacherRow', () => {
  it('linkedUserId가 없으면 teacherMemberId로 이동 식별자를 채운다', () => {
    const row = mapAffiliatedTeacherRow({
      id: '42',
      name: '김교사',
      assignedGrade: '1학년',
      phone: '010-1111-2222',
      email: 'teacher@example.com',
      employmentStatus: 'ACTIVE',
    })

    expect(row.teacherMemberId).toBe(42)
    expect(row.linkedUserId).toBe('42')
    expect(getMemberIdByUuid('42')).toBe(42)
  })
})
