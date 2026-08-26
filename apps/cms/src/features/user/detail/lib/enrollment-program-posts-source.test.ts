import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { ProgramPost } from '@/types/domain'
import {
  resolveEnrollmentProgramFilesList,
  resolveEnrollmentProgramPostsList,
} from './enrollment-program-posts-source'

const getProgramPostsByProgramId = vi.fn((_programId: string): ProgramPost[] => [
  {
    id: 'mock-post-1',
    programId: 'prog-1',
    title: 'mock 게시글',
    content: 'mock',
    authorName: '최강사',
    read: false,
    viewCount: 0,
    reactionCount: 0,
    commentCount: 0,
    attachmentCount: 0,
    postType: 'notice',
    publishedAt: '2026-01-01',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
])

vi.mock('@/data/mock', () => ({
  getProgramPostsByProgramId: (programId: string) => getProgramPostsByProgramId(programId),
  getProgramPostsByProgramIdAndSchoolId: vi.fn(() => []),
  getProgramFilesByProgramId: vi.fn(() => [
    {
      id: 'mock-file-1',
      programId: 'prog-1',
      fileName: 'mock.pdf',
      fileUrl: '/mock.pdf',
    },
  ]),
}))

describe('enrollment-program-posts-source (remote)', () => {
  beforeEach(() => {
    getProgramPostsByProgramId.mockClear()
  })

  it('remote + postsOverride 없으면 mock posts를 로드하지 않는다', () => {
    const posts = resolveEnrollmentProgramPostsList({
      membersRemote: true,
      postsOverride: null,
      programId: 'prog-1',
    })
    expect(posts).toEqual([])
    expect(getProgramPostsByProgramId).not.toHaveBeenCalled()
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
    expect(getProgramPostsByProgramId).not.toHaveBeenCalled()
  })

  it('remote + postsOverride 없으면 mock files도 로드하지 않는다', () => {
    const files = resolveEnrollmentProgramFilesList({
      membersRemote: true,
      postsOverride: null,
      programId: 'prog-1',
    })
    expect(files).toEqual([])
  })
})
