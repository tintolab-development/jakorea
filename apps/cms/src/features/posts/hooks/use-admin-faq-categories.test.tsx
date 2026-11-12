/** @vitest-environment jsdom */
import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { postsQueryKeys } from '@/features/posts/api/posts-query-keys'

vi.mock('@/features/posts/api/faqs/admin-faqs-service', () => ({
  saveFaqCategoriesBulk: vi.fn(async () => undefined),
  getFaqCategories: vi.fn(async () => []),
  createFaqCategory: vi.fn(),
  updateFaqCategory: vi.fn(),
  deleteFaqCategory: vi.fn(),
}))

vi.mock('@/features/posts/hooks/use-posts-remote-enabled', () => ({
  usePostsRemoteEnabled: () => false,
}))

import { useAdminFaqCategories } from './use-admin-faq-categories'

describe('useAdminFaqCategories onSave (QA-0286)', () => {
  it('카테고리 저장 후 FAQ 목록 쿼리를 무효화한다', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const listKey = postsQueryKeys.faqs.list('page=0')
    queryClient.setQueryData(listKey, [])
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    const { result } = renderHook(() => useAdminFaqCategories(), { wrapper })
    await act(async () => {
      await result.current.remoteActions.onSave?.({ creates: [], updates: [], deleteItems: [] })
    })

    expect(queryClient.getQueryState(listKey)?.isInvalidated).toBe(true)
  })
})
