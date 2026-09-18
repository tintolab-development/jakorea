import { describe, expect, it } from 'vitest'
import { mapInstructorRoleRequestMemberTypeLabel } from '@/features/user/api/lib/map-instructor-role-request-member-type'
import type { MemberPermissionApplicationRow } from '@/types/member-permission-application'

/**
 * 회원 유형 필터 — URL `permI_role` ↔ row.memberCategory (클라)
 * (API memberType 미사용)
 */
function filterByMemberCategory(
  rows: MemberPermissionApplicationRow[],
  role: MemberPermissionApplicationRow['memberCategory'] | 'ALL'
): MemberPermissionApplicationRow[] {
  if (role === 'ALL') return rows
  return rows.filter(r => r.memberCategory === role)
}

describe('instructor permission member-type client filter', () => {
  const rows: Pick<MemberPermissionApplicationRow, 'id' | 'memberCategory'>[] = [
    { id: '1', memberCategory: 'INDIVIDUAL' },
    { id: '2', memberCategory: 'SCHOOL' },
    { id: '3', memberCategory: 'INDIVIDUAL' },
  ]

  it('maps BE labels then filters 개인 / 학교(교사)', () => {
    const mapped = [
      mapInstructorRoleRequestMemberTypeLabel('개인'),
      mapInstructorRoleRequestMemberTypeLabel('학교/기관'),
    ]
    expect(mapped).toEqual(['INDIVIDUAL', 'SCHOOL'])

    const asRows = mapped.map((memberCategory, i) => ({
      id: String(i),
      memberCategory,
    })) as MemberPermissionApplicationRow[]

    expect(filterByMemberCategory(asRows, 'INDIVIDUAL').map(r => r.id)).toEqual(['0'])
    expect(filterByMemberCategory(asRows, 'SCHOOL').map(r => r.id)).toEqual(['1'])
  })

  it('filters mixed list by category', () => {
    expect(
      filterByMemberCategory(rows as MemberPermissionApplicationRow[], 'INDIVIDUAL').map(r => r.id)
    ).toEqual(['1', '3'])
    expect(
      filterByMemberCategory(rows as MemberPermissionApplicationRow[], 'SCHOOL').map(r => r.id)
    ).toEqual(['2'])
    expect(
      filterByMemberCategory(rows as MemberPermissionApplicationRow[], 'ALL')
    ).toHaveLength(3)
  })
})
