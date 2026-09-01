import { describe, expect, it } from 'vitest'
import { QueryClient } from '@tanstack/react-query'
import { invalidateMemberListQueries } from './invalidate-member-list-queries'
import { memberQueryKeys } from './member-query-keys'

describe('invalidateMemberListQueries', () => {
  it('회원 목록·학교 목록 쿼리를 stale로 표시한다', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    queryClient.setQueryData(memberQueryKeys.list('all'), { pages: [], pageParams: [] })
    queryClient.setQueryData(memberQueryKeys.schoolsList('schools'), { pages: [], pageParams: [] })

    invalidateMemberListQueries(queryClient)

    await Promise.resolve()

    expect(queryClient.getQueryState(memberQueryKeys.list('all'))?.isInvalidated).toBe(true)
    expect(queryClient.getQueryState(memberQueryKeys.schoolsList('schools'))?.isInvalidated).toBe(
      true
    )
  })
})
