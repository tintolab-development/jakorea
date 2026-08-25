import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import type { Notice } from '@/data/mock/notices'
import { postsQueryKeys } from '@/features/posts/api/posts-query-keys'
import {
  applyCreatedNoticeToLists,
  applyDeletedNoticeToLists,
  applyUpdatedNoticeToLists,
} from './notice-query-cache'

function notice(partial: Partial<Notice> & Pick<Notice, 'id' | 'title'>): Notice {
  return {
    content: '',
    category: '일반',
    createdAt: '2026-08-24T00:00:00.000Z',
    isImportant: false,
    viewCount: 0,
    hasAttachment: false,
    author: '관리자',
    status: 'published',
    ...partial,
  }
}

describe('notice-query-cache', () => {
  it('prepends a created notice onto cached lists', () => {
    const queryClient = new QueryClient()
    const listKey = postsQueryKeys.notices.list('')
    queryClient.setQueryData<Notice[]>(listKey, [notice({ id: '1', title: '기존' })])

    applyCreatedNoticeToLists(queryClient, notice({ id: '2', title: '신규' }))

    expect(queryClient.getQueryData<Notice[]>(listKey)?.map(row => row.id)).toEqual(['2', '1'])
  })

  it('does not add a published notice to a private visibility list', () => {
    const queryClient = new QueryClient()
    const privateKey = postsQueryKeys.notices.list('an_vis=private')
    queryClient.setQueryData<Notice[]>(privateKey, [notice({ id: '1', title: '초안', status: 'draft' })])

    applyCreatedNoticeToLists(queryClient, notice({ id: '2', title: '공개' }))

    expect(queryClient.getQueryData<Notice[]>(privateKey)?.map(row => row.id)).toEqual(['1'])
  })

  it('does not duplicate an already cached notice', () => {
    const queryClient = new QueryClient()
    const listKey = postsQueryKeys.notices.list('')
    const existing = notice({ id: '1', title: '기존' })
    queryClient.setQueryData<Notice[]>(listKey, [existing])

    applyCreatedNoticeToLists(queryClient, existing)

    expect(queryClient.getQueryData<Notice[]>(listKey)).toHaveLength(1)
  })

  it('replaces an updated notice in cached lists', () => {
    const queryClient = new QueryClient()
    const listKey = postsQueryKeys.notices.list('an_vis=public')
    queryClient.setQueryData<Notice[]>(listKey, [notice({ id: '1', title: '이전' })])

    applyUpdatedNoticeToLists(queryClient, notice({ id: '1', title: '수정' }))

    expect(queryClient.getQueryData<Notice[]>(listKey)?.[0]?.title).toBe('수정')
  })

  it('removes a notice from a visibility list when status no longer matches', () => {
    const queryClient = new QueryClient()
    const publicKey = postsQueryKeys.notices.list('an_vis=public')
    queryClient.setQueryData<Notice[]>(publicKey, [notice({ id: '1', title: '공개' })])

    applyUpdatedNoticeToLists(queryClient, notice({ id: '1', title: '비공개', status: 'draft' }))

    expect(queryClient.getQueryData<Notice[]>(publicKey)).toEqual([])
  })

  it('removes a deleted notice from cached lists', () => {
    const queryClient = new QueryClient()
    const listKey = postsQueryKeys.notices.list('')
    queryClient.setQueryData<Notice[]>(listKey, [
      notice({ id: '1', title: '유지' }),
      notice({ id: '2', title: '삭제' }),
    ])

    applyDeletedNoticeToLists(queryClient, '2')

    expect(queryClient.getQueryData<Notice[]>(listKey)?.map(row => row.id)).toEqual(['1'])
  })
})
