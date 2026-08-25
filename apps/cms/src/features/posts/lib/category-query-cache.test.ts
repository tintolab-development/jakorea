import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'
import { postsQueryKeys } from '@/features/posts/api/posts-query-keys'
import type { CategoryRow } from '@/features/posts/api/shared/category-adapters'
import {
  applyCreatedCategoryList,
  applyDeletedCategoryList,
  applyRenamedCategoryList,
} from './category-query-cache'

function createClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 15 * 60_000 } },
  })
}

describe('applyCreatedCategoryList', () => {
  it('patches cache and does not refetch when create payload is mapped', async () => {
    const queryClient = createClient()
    const key = postsQueryKeys.notices.categories()
    const previous: CategoryRow[] = [{ id: '1', name: '공지' }]
    queryClient.setQueryData(key, previous)
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')

    await applyCreatedCategoryList(queryClient, key, { id: '2', name: '신규' })

    expect(queryClient.getQueryData(key)).toEqual([...previous, { id: '2', name: '신규' }])
    expect(queryClient.getQueryState(key)?.isInvalidated).toBe(false)
    expect(invalidate).not.toHaveBeenCalled()
  })

  it('invalidates so GET can recover when create payload cannot be mapped', async () => {
    const queryClient = createClient()
    const key = postsQueryKeys.notices.categories()
    queryClient.setQueryData(key, [{ id: '1', name: '공지' }])
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')

    await applyCreatedCategoryList(queryClient, key, null)

    expect(invalidate).toHaveBeenCalledWith({ queryKey: key })
    expect(queryClient.getQueryState(key)?.isInvalidated).toBe(true)
  })
})

describe('applyRenamedCategoryList / applyDeletedCategoryList', () => {
  it('patches rename and delete in cache without invalidate', async () => {
    const queryClient = createClient()
    const key = postsQueryKeys.faqs.categories()
    queryClient.setQueryData(key, [
      { id: '1', name: '공지' },
      { id: '2', name: '안내' },
    ])
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')

    await applyRenamedCategoryList(queryClient, key, '2', '이벤트')
    expect(queryClient.getQueryData(key)).toEqual([
      { id: '1', name: '공지' },
      { id: '2', name: '이벤트' },
    ])

    await applyDeletedCategoryList(queryClient, key, '1')
    expect(queryClient.getQueryData(key)).toEqual([{ id: '2', name: '이벤트' }])
    expect(invalidate).not.toHaveBeenCalled()
  })

  it('falls back to invalidate when the list cache is empty', async () => {
    const queryClient = createClient()
    const key = postsQueryKeys.notices.categories()
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')

    await applyRenamedCategoryList(queryClient, key, '1', '공지')
    await applyDeletedCategoryList(queryClient, key, '1')

    expect(invalidate).toHaveBeenCalledTimes(2)
  })
})
