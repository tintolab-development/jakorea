import { describe, expect, it } from 'vitest'
import { resolveInstructorAffiliationParts } from '@/features/user/detail/ui/user-basic-info/display'
import type { User } from '@/types/user'

function instructor(partial: Partial<Omit<User, 'password'>>): Omit<User, 'password'> {
  return {
    id: 'u1',
    email: 'a@b.c',
    name: '강사',
    role: 'INSTRUCTOR',
    isActive: true,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    ...partial,
  }
}

describe('resolveInstructorAffiliationParts', () => {
  it('학교·JA 강사단을 분리하고 중복을 제거한다', () => {
    const parts = resolveInstructorAffiliationParts(
      instructor({
        affiliatedSchoolName: '진월초등학교',
        affiliation: '진월초등학교, 제미나이 강사단',
        listMetrics: { permissionApplicationTypeLabel: '제미나이 강사단' },
      })
    )
    expect(parts.schoolName).toBe('진월초등학교')
    expect(parts.others).toEqual(['제미나이 강사단'])
  })

  it('소속이 여러 개면 콤마로 파싱한다', () => {
    const parts = resolveInstructorAffiliationParts(
      instructor({
        affiliation: 'OO초등학교, JA 강사단',
      })
    )
    expect(parts.schoolName).toBeUndefined()
    expect(parts.others).toEqual(['OO초등학교', 'JA 강사단'])
  })

  it('affiliation의 직책(| 뒤)은 소속명에서 제외한다', () => {
    const parts = resolveInstructorAffiliationParts(
      instructor({
        affiliatedSchoolName: '진월초등학교',
        affiliation: '경제교육연구소 | 수석강사',
      })
    )
    expect(parts.schoolName).toBe('진월초등학교')
    expect(parts.others).toEqual(['경제교육연구소'])
  })
})
