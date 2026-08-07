import { describe, expect, it } from 'vitest'
import { filterMemberListItemsForSchoolRole } from './map-member-list-item'

describe('filterMemberListItemsForSchoolRole', () => {
  it('roles에 SCHOOL 포함 항목만 남긴다', () => {
    const items = [
      { memberId: 1, roles: ['SCHOOL'], name: 'A학교' },
      { memberId: 2, roles: ['INSTRUCTOR'], name: '강사' },
      { memberId: 3, roles: ['SCHOOL_TEACHER'], name: '교사강사' },
      { memberId: 4, roles: ['SCHOOL', 'INSTRUCTOR'], name: '겸직' },
      { memberId: 5, role: 'SCHOOL', name: 'legacy' },
    ]

    const filtered = filterMemberListItemsForSchoolRole(items)
    expect(filtered.map(i => i.memberId)).toEqual([1, 4])
  })
})
