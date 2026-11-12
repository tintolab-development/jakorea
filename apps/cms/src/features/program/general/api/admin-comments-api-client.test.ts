import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/api/orval-mutator', () => ({
  default: vi.fn(),
}))

vi.mock('@/features/data-management/api/unwrap-api-body', () => ({
  unwrapApiBody: vi.fn((v: unknown) => v),
}))

import customInstance from '@/shared/api/orval-mutator'
import {
  resolveLatestAdminComment,
  resolveLatestAdminCommentText,
  upsertAdminCommentByTargetRemote,
} from './admin-comments-api-client'

const mockedInstance = vi.mocked(customInstance)

describe('resolveLatestAdminComment', () => {
  it('picks newest by updatedAt', () => {
    const latest = resolveLatestAdminComment([
      { commentId: 1, comment: 'old', updatedAt: '2026-01-01T00:00:00Z' },
      { commentId: 2, comment: 'new', updatedAt: '2026-09-01T00:00:00Z' },
    ])
    expect(latest?.commentId).toBe(2)
    expect(resolveLatestAdminCommentText([
      { commentId: 1, comment: 'old', updatedAt: '2026-01-01T00:00:00Z' },
      { commentId: 2, comment: 'new', updatedAt: '2026-09-01T00:00:00Z' },
    ])).toBe('new')
  })
})

describe('upsertAdminCommentByTargetRemote', () => {
  beforeEach(() => {
    mockedInstance.mockReset()
  })

  it('본문이 있으면 기존 코멘트 조회 없이 POST한다 (서버 upsert)', async () => {
    mockedInstance.mockResolvedValueOnce({ commentId: 10, comment: 'hello' })

    const result = await upsertAdminCommentByTargetRemote({
      targetType: 'ORGANIZATION_APPLICATION',
      targetId: 99,
      screenCode: 'ORGANIZATION_APPLICATION',
      comment: 'hello',
    })

    expect(result.commentText).toBe('hello')
    expect(mockedInstance).toHaveBeenCalledTimes(1)
    expect(mockedInstance).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        url: '/api/admin/comments',
        method: 'POST',
        data: expect.objectContaining({ comment: 'hello', targetId: 99 }),
      })
    )
  })

  it('강사 신청 대상에 관리자 코멘트를 POST한다', async () => {
    mockedInstance.mockResolvedValueOnce({ commentId: 11, comment: '강사 메모' })

    await upsertAdminCommentByTargetRemote({
      targetType: 'INSTRUCTOR_APPLICATION',
      targetId: 201,
      screenCode: 'INSTRUCTOR_APPLICATION',
      comment: '강사 메모',
    })

    expect(mockedInstance).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        url: '/api/admin/comments',
        method: 'POST',
        data: {
          targetType: 'INSTRUCTOR_APPLICATION',
          targetId: 201,
          screenCode: 'INSTRUCTOR_APPLICATION',
          comment: '강사 메모',
        },
      })
    )
  })

  it('이미 코멘트가 있어도 PATCH 없이 POST로 덮어쓴다', async () => {
    mockedInstance.mockResolvedValueOnce({ commentId: 7, comment: 'updated' })

    const result = await upsertAdminCommentByTargetRemote({
      targetType: 'ORGANIZATION_APPLICATION',
      targetId: 99,
      screenCode: 'ORGANIZATION_APPLICATION',
      comment: 'updated',
    })

    expect(result.commentText).toBe('updated')
    expect(result.comment?.commentId).toBe(7)
    expect(mockedInstance).toHaveBeenCalledTimes(1)
    expect(mockedInstance).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/api/admin/comments', method: 'POST' })
    )
    expect(mockedInstance).not.toHaveBeenCalledWith(
      expect.objectContaining({ method: 'PATCH' })
    )
  })

  it('DELETEs when comment cleared and latest exists', async () => {
    mockedInstance
      .mockResolvedValueOnce([
        { commentId: 7, comment: 'prev', updatedAt: '2026-09-01T00:00:00Z' },
      ])
      .mockResolvedValueOnce(undefined)

    const result = await upsertAdminCommentByTargetRemote({
      targetType: 'VOLUNTEER_APPLICATION',
      targetId: 5,
      screenCode: 'VOLUNTEER_APPLICATION',
      comment: '   ',
    })

    expect(result.commentText).toBeUndefined()
    expect(mockedInstance).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        url: '/api/admin/comments/7',
        method: 'DELETE',
      })
    )
  })
})
