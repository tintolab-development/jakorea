import { beforeEach, describe, expect, it, vi } from 'vitest'

const api = vi.hoisted(() => ({
  createMemberComment: vi.fn(),
  createComment: vi.fn(),
  listMemberComments: vi.fn(),
  listComments: vi.fn(),
  deleteMemberComment: vi.fn(),
  deleteComment: vi.fn(),
}))

vi.mock('@/shared/api/generated/members/members-api', () => ({
  getJAKoreaCMSBackendAPIMembersSubset: () => api,
}))

vi.mock('@/features/data-management/api/unwrap-api-body', () => ({
  unwrapApiBody: vi.fn((v: unknown) => v),
}))

import {
  deleteMemberAdminCommentRemote,
  upsertMemberAdminCommentRemote,
} from './members-api-client'

describe('upsertMemberAdminCommentRemote (QA-0044 대상·화면당 1건)', () => {
  beforeEach(() => {
    Object.values(api).forEach(fn => fn.mockReset())
  })

  it('회원 코멘트는 기존 코멘트 조회 없이 등록 API만 호출한다', async () => {
    api.createMemberComment.mockResolvedValueOnce({ commentId: 3, comment: '메모' })

    const saved = await upsertMemberAdminCommentRemote(10, ' 메모 ', { target: 'member' })

    expect(saved.commentId).toBe(3)
    expect(api.listMemberComments).not.toHaveBeenCalled()
    expect(api.createMemberComment).toHaveBeenCalledWith(10, {
      screenCode: 'SCR_MEMBER',
      comment: '메모',
    })
  })

  it('학교 코멘트도 회원 경로 등록 API로 저장한다', async () => {
    api.createMemberComment.mockResolvedValueOnce({ commentId: 4, comment: '학교 메모' })

    await upsertMemberAdminCommentRemote(20, '학교 메모', { target: 'schoolOrganization' })

    expect(api.listMemberComments).not.toHaveBeenCalled()
    expect(api.createMemberComment).toHaveBeenCalledWith(20, {
      screenCode: 'SCR_MEMBER',
      comment: '학교 메모',
    })
  })

  it('관리자 계정 코멘트는 관리자 계정 등록 API만 호출한다', async () => {
    api.createComment.mockResolvedValueOnce({ commentId: 5, comment: '관리자 메모' })

    await upsertMemberAdminCommentRemote(30, '관리자 메모', { target: 'adminAccount' })

    expect(api.listComments).not.toHaveBeenCalled()
    expect(api.createComment).toHaveBeenCalledWith(30, {
      screenCode: 'SCR_MEMBER',
      comment: '관리자 메모',
    })
  })

  it('빈 코멘트는 등록하지 않는다', async () => {
    await expect(upsertMemberAdminCommentRemote(10, '   ')).rejects.toThrow()
    expect(api.createMemberComment).not.toHaveBeenCalled()
  })
})

describe('deleteMemberAdminCommentRemote (빈 값 저장 → DELETE 유지)', () => {
  beforeEach(() => {
    Object.values(api).forEach(fn => fn.mockReset())
  })

  it('commentId를 모르면 해당 화면 코멘트 1건을 조회해 DELETE한다', async () => {
    api.listMemberComments.mockResolvedValueOnce([
      { commentId: 9, screenCode: 'SCR_MEMBER', comment: '메모' },
    ])

    await expect(deleteMemberAdminCommentRemote(10)).resolves.toBe(true)
    expect(api.deleteMemberComment).toHaveBeenCalledWith(10, 9)
  })

  it('관리자 계정은 관리자 계정 삭제 API를 쓴다', async () => {
    await expect(
      deleteMemberAdminCommentRemote(30, { existingCommentId: 2, target: 'adminAccount' })
    ).resolves.toBe(true)
    expect(api.listComments).not.toHaveBeenCalled()
    expect(api.deleteComment).toHaveBeenCalledWith(30, 2)
  })

  it('삭제할 코멘트가 없으면 아무것도 호출하지 않는다', async () => {
    api.listMemberComments.mockResolvedValueOnce([])

    await expect(deleteMemberAdminCommentRemote(10)).resolves.toBe(false)
    expect(api.deleteMemberComment).not.toHaveBeenCalled()
  })
})
