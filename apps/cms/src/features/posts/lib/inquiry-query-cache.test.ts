import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import { postsQueryKeys } from '@/features/posts/api/posts-query-keys'
import type { AdminInquiryRow } from '@/features/posts/model/admin-inquiry-management.types'
import {
  applyDeletedInquiryToLists,
  applyUpdatedInquiryToLists,
  removeInquiryDetailQueries,
} from './inquiry-query-cache'

function inquiry(partial: Partial<AdminInquiryRow> & Pick<AdminInquiryRow, 'id'>): AdminInquiryRow {
  return {
    title: '문의',
    category: '일반',
    status: 'PENDING',
    createdAt: '2026-08-24T00:00:00.000Z',
    memberName: '회원',
    programName: null,
    assignee: null,
    answeredAt: null,
    body: '',
    phone: '',
    email: '',
    answerMarkdown: null,
    ...partial,
  }
}

describe('inquiry-query-cache', () => {
  it('patches an updated inquiry across cached lists', () => {
    const queryClient = new QueryClient()
    const listKey = postsQueryKeys.inquiries.list('')
    queryClient.setQueryData<AdminInquiryRow[]>(listKey, [inquiry({ id: '1' })])

    applyUpdatedInquiryToLists(
      queryClient,
      inquiry({ id: '1', status: 'ANSWERED', answerMarkdown: '답변' })
    )

    expect(queryClient.getQueryData<AdminInquiryRow[]>(listKey)?.[0]?.status).toBe('ANSWERED')
  })

  it('removes a deleted inquiry from lists and drops detail caches', () => {
    const queryClient = new QueryClient()
    const listKey = postsQueryKeys.inquiries.list('status=PENDING')
    queryClient.setQueryData<AdminInquiryRow[]>(listKey, [
      inquiry({ id: '1' }),
      inquiry({ id: '2' }),
    ])
    queryClient.setQueryData(postsQueryKeys.inquiries.detail('2'), inquiry({ id: '2' }))
    queryClient.setQueryData(postsQueryKeys.inquiries.answers('2'), [])

    applyDeletedInquiryToLists(queryClient, '2')
    removeInquiryDetailQueries(queryClient, '2')

    expect(queryClient.getQueryData<AdminInquiryRow[]>(listKey)?.map(row => row.id)).toEqual(['1'])
    expect(queryClient.getQueryData(postsQueryKeys.inquiries.detail('2'))).toBeUndefined()
    expect(queryClient.getQueryData(postsQueryKeys.inquiries.answers('2'))).toBeUndefined()
  })
})
