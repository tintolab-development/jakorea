import { describe, expect, it } from 'vitest'
import {
  groupProgramPostAttachmentsByPostId,
  mapProgramPostResponseToDomain,
} from './program-post-adapters'

describe('mapProgramPostResponseToDomain', () => {
  it('관리자 상세 런타임 응답의 postId를 게시글 id로 쓴다', () => {
    const post = mapProgramPostResponseToDomain(
      { postId: 1693318, programId: 186046, content: '가나다', readCount: 1 },
      '186046'
    )
    expect(post.id).toBe('1693318')
    expect(post.viewCount).toBe(1)
  })

  it('이전 응답의 id도 계속 받는다', () => {
    const post = mapProgramPostResponseToDomain({ id: 30001, programId: 1201 }, '1201')
    expect(post.id).toBe('30001')
  })
})

describe('groupProgramPostAttachmentsByPostId', () => {
  it('postId별로 첨부를 묶는다', () => {
    const map = groupProgramPostAttachmentsByPostId([
      { postId: 10, attachmentId: 1 },
      { postId: 10, attachmentId: 2 },
      { postId: 20, attachmentId: 3 },
    ])
    expect(map.get('10')).toHaveLength(2)
    expect(map.get('20')).toHaveLength(1)
  })

  it('postId가 없는 항목은 건너뛴다', () => {
    const map = groupProgramPostAttachmentsByPostId([
      { attachmentId: 1 },
      { postId: 5, attachmentId: 2 },
    ])
    expect(map.size).toBe(1)
    expect(map.get('5')).toHaveLength(1)
  })
})
