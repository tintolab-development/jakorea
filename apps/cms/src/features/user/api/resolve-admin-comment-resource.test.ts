import { describe, expect, it } from 'vitest'
import { resolveAdminCommentResource } from '@/features/user/api/resolve-admin-comment-resource'

describe('resolveAdminCommentResource', () => {
  it('학교 organization은 organizationId를 코멘트 resource id로 쓴다', () => {
    expect(
      resolveAdminCommentResource({
        id: 'organization-12',
        role: 'SCHOOL',
        organizationId: 12,
      })
    ).toEqual({ resourceId: 12, target: 'schoolOrganization' })
  })

  it('일반 회원은 memberId를 쓴다', () => {
    expect(
      resolveAdminCommentResource({
        id: 'member-3',
        role: 'INDIVIDUAL',
        memberId: 3,
      })
    ).toEqual({ resourceId: 3, target: 'member' })
  })

  it('legacy 학교 member는 organizationId가 없으면 memberId fallback', () => {
    expect(
      resolveAdminCommentResource({
        id: 'member-99',
        role: 'SCHOOL',
        memberId: 99,
      })
    ).toEqual({ resourceId: 99, target: 'member' })
  })
})
