import { describe, expect, it } from 'vitest'
import {
  resolveEnrollmentProgramFilesList,
  resolveEnrollmentProgramPostsList,
} from './enrollment-program-posts-source'

describe('enrollment-program-posts-source (remote)', () => {
  it('remote + postsOverride 없으면 빈 posts를 반환한다', () => {
    const posts = resolveEnrollmentProgramPostsList({
      membersRemote: true,
      postsOverride: null,
      programId: 'prog-1',
    })
    expect(posts).toEqual([])
  })

  it('remote + postsOverride가 있으면 주입 목록을 사용한다', () => {
    const posts = resolveEnrollmentProgramPostsList({
      membersRemote: true,
      postsOverride: [
        {
          id: 'api-post-1',
          programId: 'prog-1',
          title: 'API 게시글',
          content: 'from api',
          authorName: '관리자',
          read: true,
          viewCount: 0,
          reactionCount: 0,
          commentCount: 0,
          attachmentCount: 0,
          postType: 'notice',
          publishedAt: '2026-02-01',
          createdAt: '2026-02-01',
          updatedAt: '2026-02-01',
        },
      ],
      programId: 'prog-1',
    })
    expect(posts[0]?.title).toBe('API 게시글')
  })

  it('remote + postsOverride 없으면 빈 files를 반환한다', () => {
    const files = resolveEnrollmentProgramFilesList({
      membersRemote: true,
      postsOverride: null,
      programId: 'prog-1',
    })
    expect(files).toEqual([])
  })
})
