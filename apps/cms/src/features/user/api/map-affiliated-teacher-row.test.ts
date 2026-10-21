import { describe, expect, it } from 'vitest'
import {
  mapAffiliatedTeacherRow,
  resolveAffiliatedTeacherWithdrawTarget,
} from './map-affiliated-teacher-row'
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

  it('문자열 memberId도 교사 식별자로 받는다', () => {
    const row = mapAffiliatedTeacherRow({
      memberId: '42' as unknown as number,
      name: '이교사',
    })
    expect(row.teacherMemberId).toBe(42)
    expect(row.linkedUserId).toBe('42')
  })
})

describe('resolveAffiliatedTeacherWithdrawTarget', () => {
  it('uuid가 없어도 memberId로 탈퇴 대상을 만든다', () => {
    expect(
      resolveAffiliatedTeacherWithdrawTarget({ teacherMemberId: 7 })
    ).toEqual({ userId: '7', memberId: 7 })
  })
})
