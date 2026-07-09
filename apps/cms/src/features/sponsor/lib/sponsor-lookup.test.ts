import { describe, expect, it } from 'vitest'
import { QueryClient } from '@tanstack/react-query'
import { dataManagementQueryKeys } from '@/features/data-management/api/data-management-query-keys'
import { getSponsorNameFromCache } from './sponsor-lookup'

describe('getSponsorNameFromCache', () => {
  it('finds sponsor name from options list cache', () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData(dataManagementQueryKeys.sponsors.options(), [
      { id: 'sp-1', name: '후원사 A' },
    ])

    expect(getSponsorNameFromCache(queryClient, 'sp-1')).toBe('후원사 A')
  })

  it('ignores non-array sponsor query cache entries (detail object 등)', () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData(dataManagementQueryKeys.sponsors.detail('sp-1'), {
      id: 'sp-1',
      name: '상세 후원사',
      nameDisplayKo: '상세 후원사',
    })
    queryClient.setQueryData(dataManagementQueryKeys.sponsors.options(), [
      { id: 'sp-2', name: '목록 후원사' },
    ])

    expect(getSponsorNameFromCache(queryClient, 'sp-1')).toBe('상세 후원사')
    expect(getSponsorNameFromCache(queryClient, 'sp-2')).toBe('목록 후원사')
    expect(getSponsorNameFromCache(queryClient, 'sp-missing')).toBeUndefined()
  })
})
