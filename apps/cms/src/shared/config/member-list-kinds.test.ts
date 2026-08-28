import { describe, expect, it } from 'vitest'
import {
  isMemberListMenuHref,
  memberListHref,
  resolveRoleFilterFromMemberListParams,
} from './member-list-kinds'

describe('isMemberListMenuHref', () => {
  it('회원 유형 LNB href만 true', () => {
    expect(isMemberListMenuHref(memberListHref('all'))).toBe(true)
    expect(isMemberListMenuHref(memberListHref('instructors'))).toBe(true)
    expect(isMemberListMenuHref('/admin/permission-requests')).toBe(false)
  })
})

describe('resolveRoleFilterFromMemberListParams', () => {
  it('institutions kind는 SCHOOL role 필터', () => {
    expect(resolveRoleFilterFromMemberListParams({ kind: 'institutions' })).toBe('SCHOOL')
  })

  it('legacy role=SCHOOL_TEACHER는 필터에 노출하지 않는다', () => {
    expect(resolveRoleFilterFromMemberListParams({ role: 'SCHOOL_TEACHER' })).toBeUndefined()
    expect(
      resolveRoleFilterFromMemberListParams({ kind: 'all', role: 'SCHOOL_TEACHER' })
    ).toBeUndefined()
  })
})
