import { describe, expect, it } from 'vitest'
import type { ProgramPost } from '@/types/domain'
import { resolveEnrollmentProgramPostsList } from './enrollment-program-posts-source'

function post(partial: Partial<ProgramPost> & Pick<ProgramPost, 'id'>): ProgramPost {
  return {
    programId: '186495',
    authorName: 'JA',
    content: '본문',
    read: true,
    viewCount: 0,
    reactionCount: 0,
    commentCount: 0,
    attachmentCount: 0,
    publishedAt: '2026-01-01T00:00:00Z',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...partial,
  }
}

describe('resolveEnrollmentProgramPostsList', () => {
  it('schoolId가 있으면 해당 기관 게시글만 남긴다', () => {
    const list = resolveEnrollmentProgramPostsList({
      membersRemote: true,
      programId: '186495',
      schoolId: '1691554',
      postsOverride: [
        post({ id: '1', schoolId: '1691554' }),
        post({ id: '2', schoolId: '999' }),
        post({ id: '3' }),
      ],
    })
    expect(list.map(item => item.id)).toEqual(['1'])
  })

  it('schoolId가 없으면 override 전체를 반환한다', () => {
    const override = [post({ id: '1' }), post({ id: '2', schoolId: '1691554' })]
    const list = resolveEnrollmentProgramPostsList({
      membersRemote: true,
      programId: '186495',
      postsOverride: override,
    })
    expect(list).toHaveLength(2)
  })
})
