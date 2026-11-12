import { describe, expect, it } from 'vitest'
import { resolveMemberAdminComment } from './map-member-comments'

describe('resolveMemberAdminComment', () => {
  it('해당 화면 코멘트 1건을 돌려준다', () => {
    expect(
      resolveMemberAdminComment([{ commentId: 1, screenCode: 'SCR_MEMBER', comment: ' 메모 ' }])
    ).toEqual({ commentId: 1, comment: '메모' })
  })

  it('다른 화면 코멘트는 쓰지 않는다', () => {
    expect(
      resolveMemberAdminComment([{ commentId: 2, screenCode: 'SCR_OTHER', comment: '메모' }])
    ).toBeUndefined()
  })

  it('screenCode가 없는 코멘트는 해당 화면 코멘트로 본다', () => {
    expect(resolveMemberAdminComment([{ commentId: 3, comment: '메모' }])).toEqual({
      commentId: 3,
      comment: '메모',
    })
  })

  it('비어 있으면 undefined', () => {
    expect(resolveMemberAdminComment(undefined)).toBeUndefined()
    expect(resolveMemberAdminComment([])).toBeUndefined()
    expect(
      resolveMemberAdminComment([{ commentId: 4, screenCode: 'SCR_MEMBER', comment: '  ' }])
    ).toBeUndefined()
  })
})
