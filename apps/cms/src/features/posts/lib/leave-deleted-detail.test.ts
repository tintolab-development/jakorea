import { QueryClient, QueryObserver } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import { postsQueryKeys } from '@/features/posts/api/posts-query-keys'
import { discardDeletedDetailQuery } from './leave-deleted-detail'

describe('discardDeletedDetailQuery', () => {
  const queryKey = postsQueryKeys.notices.detail('n1')

  it('removes the detail cache when nothing is observing it', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    queryClient.setQueryData(queryKey, { id: 'n1' })

    expect(discardDeletedDetailQuery(queryClient, queryKey)).toBe(true)
    expect(queryClient.getQueryData(queryKey)).toBeUndefined()
  })

  it('keeps the detail cache while an observer is still subscribed', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    queryClient.setQueryData(queryKey, { id: 'n1' })

    const observer = new QueryObserver(queryClient, {
      queryKey,
      queryFn: () => Promise.resolve({ id: 'n1' }),
      enabled: true,
    })
    const unsubscribe = observer.subscribe(() => undefined)

    expect(discardDeletedDetailQuery(queryClient, queryKey)).toBe(false)
    expect(queryClient.getQueryData(queryKey)).toEqual({ id: 'n1' })

    unsubscribe()
    expect(discardDeletedDetailQuery(queryClient, queryKey)).toBe(true)
    expect(queryClient.getQueryData(queryKey)).toBeUndefined()
  })
})
