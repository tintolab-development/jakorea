import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import type { UjatEducationRegion } from '@/features/program/ujat/model/education-region.types'
import {
  applyCreatedEducationRegion,
  applyDeletedEducationRegion,
  applyUpdatedEducationRegion,
} from './list-cache'
import { ujatEducationRegionQueryKeys } from './query-keys'

function region(
  partial: Partial<UjatEducationRegion> & Pick<UjatEducationRegion, 'id' | 'name'>
): UjatEducationRegion {
  return {
    regionKey: `region_${partial.id}`,
    sortOrder: 1,
    active: true,
    createdByName: '',
    createdAt: '2026-08-24T00:00:00.000Z',
    hasUsageHistory: false,
    ...partial,
  }
}

describe('ujat education-region list-cache', () => {
  const listKey = ujatEducationRegionQueryKeys.list('remote')

  it('appends a created region and keeps sort order', () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData<UjatEducationRegion[]>(listKey, [
      region({ id: '1', name: '서울', sortOrder: 1 }),
    ])

    applyCreatedEducationRegion(
      queryClient,
      'remote',
      region({ id: '2', name: '경기', sortOrder: 99 })
    )

    expect(queryClient.getQueryData<UjatEducationRegion[]>(listKey)?.map(row => row.id)).toEqual([
      '1',
      '2',
    ])
  })

  it('does not duplicate an already cached region', () => {
    const queryClient = new QueryClient()
    const existing = region({ id: '1', name: '서울' })
    queryClient.setQueryData<UjatEducationRegion[]>(listKey, [existing])

    applyCreatedEducationRegion(queryClient, 'remote', existing)

    expect(queryClient.getQueryData<UjatEducationRegion[]>(listKey)).toHaveLength(1)
  })

  it('replaces an updated region in the cached list', () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData<UjatEducationRegion[]>(listKey, [
      region({ id: '1', name: '서울' }),
    ])

    applyUpdatedEducationRegion(queryClient, 'remote', region({ id: '1', name: '서울특별시' }))

    expect(queryClient.getQueryData<UjatEducationRegion[]>(listKey)?.[0]?.name).toBe('서울특별시')
  })

  it('removes a deleted region from the cached list', () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData<UjatEducationRegion[]>(listKey, [
      region({ id: '1', name: '서울' }),
      region({ id: '2', name: '경기' }),
    ])

    applyDeletedEducationRegion(queryClient, 'remote', '2')

    expect(queryClient.getQueryData<UjatEducationRegion[]>(listKey)?.map(row => row.id)).toEqual([
      '1',
    ])
  })
})
