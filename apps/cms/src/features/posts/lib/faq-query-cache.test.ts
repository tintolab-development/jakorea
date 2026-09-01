import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import type { AdminFaq } from '@/data/mock/admin-faqs'
import { postsQueryKeys } from '@/features/posts/api/posts-query-keys'
import {
  applyCreatedFaqToLists,
  applyDeletedFaqToLists,
  applyUpdatedFaqToLists,
} from './faq-query-cache'

function faq(partial: Partial<AdminFaq> & Pick<AdminFaq, 'id' | 'question'>): AdminFaq {
  return {
    category: '일반',
    answer: '',
    author: '관리자',
    status: 'published',
    createdAt: '2026-08-24T00:00:00.000Z',
    ...partial,
  }
}

describe('faq-query-cache', () => {
  it('prepends a created faq onto unfiltered lists only', () => {
    const queryClient = new QueryClient()
    const allKey = postsQueryKeys.faqs.list('')
    const privateKey = postsQueryKeys.faqs.list('af_vis=private')
    queryClient.setQueryData<AdminFaq[]>(allKey, [faq({ id: '1', question: '기존' })])
    queryClient.setQueryData<AdminFaq[]>(privateKey, [faq({ id: '1', question: '초안', status: 'draft' })])

    applyCreatedFaqToLists(queryClient, faq({ id: '2', question: '신규' }))

    expect(queryClient.getQueryData<AdminFaq[]>(allKey)?.map(row => row.id)).toEqual(['2', '1'])
    expect(queryClient.getQueryData<AdminFaq[]>(privateKey)?.map(row => row.id)).toEqual(['1'])
  })

  it('removes a deleted faq from cached lists', () => {
    const queryClient = new QueryClient()
    const listKey = postsQueryKeys.faqs.list('')
    queryClient.setQueryData<AdminFaq[]>(listKey, [
      faq({ id: '1', question: '유지' }),
      faq({ id: '2', question: '삭제' }),
    ])

    applyDeletedFaqToLists(queryClient, '2')

    expect(queryClient.getQueryData<AdminFaq[]>(listKey)?.map(row => row.id)).toEqual(['1'])
  })

  it('drops an updated faq from public list when it becomes draft', () => {
    const queryClient = new QueryClient()
    const publicKey = postsQueryKeys.faqs.list('af_vis=public')
    queryClient.setQueryData<AdminFaq[]>(publicKey, [faq({ id: '1', question: '공개' })])

    applyUpdatedFaqToLists(queryClient, faq({ id: '1', question: '비공개', status: 'draft' }))

    expect(queryClient.getQueryData<AdminFaq[]>(publicKey)).toEqual([])
  })
})
