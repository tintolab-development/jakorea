import { describe, expect, it } from 'vitest'
import { mapProgramPostResponseToDomain } from './program-post-adapters'

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
