import { QueryClient, type InfiniteData } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import type { DataManagementListPage } from '@/features/data-management/api/data-management-list-page'
import { dataManagementQueryKeys } from '@/features/data-management/api/data-management-query-keys'
import type { SponsorManagementRow } from '@/features/sponsor/model/sponsor-management.types'
import {
  applyDeletedSponsorsToLists,
  discardDeletedSponsorCaches,
} from './query-cache'

function row(id: string, name = id): SponsorManagementRow {
  return {
    id,
    name,
    createdAt: '',
    updatedAt: '',
    programCount: 0,
    totalDonationAmount: 0,
    totalBeneficiaryCount: 0,
  }
}

describe('sponsor query-cache', () => {
  it('removes deleted sponsors from infinite list pages and decrements totalElements', () => {
    const queryClient = new QueryClient()
    const listKey = dataManagementQueryKeys.sponsors.list('sp_kind=corporate')
    const cached: InfiniteData<DataManagementListPage<SponsorManagementRow>> = {
      pages: [
        {
          items: [row('1', '유지'), row('2', '삭제')],
          page: 0,
          size: 20,
          totalElements: 3,
          totalPages: 1,
          hasNext: false,
        },
        {
          items: [row('3', '다음페이지')],
          page: 1,
          size: 20,
          totalElements: 3,
          totalPages: 1,
          hasNext: false,
        },
      ],
      pageParams: [0, 1],
    }
    queryClient.setQueryData(listKey, cached)

    applyDeletedSponsorsToLists(queryClient, ['2', '3'])

    const next =
      queryClient.getQueryData<InfiniteData<DataManagementListPage<SponsorManagementRow>>>(
        listKey
      )
    expect(next?.pages[0]?.items.map(item => item.id)).toEqual(['1'])
    expect(next?.pages[0]?.totalElements).toBe(1)
    expect(next?.pages[1]?.items.map(item => item.id)).toEqual([])
    expect(next?.pages[1]?.totalElements).toBe(1)
  })

  it('removes deleted sponsors from options and options-infinite caches', () => {
    const queryClient = new QueryClient()
    const optionsKey = dataManagementQueryKeys.sponsors.options()
    const infiniteKey = dataManagementQueryKeys.sponsors.optionsInfinite('')
    queryClient.setQueryData(optionsKey, [row('1'), row('2')])
    queryClient.setQueryData<InfiniteData<DataManagementListPage<SponsorManagementRow>>>(
      infiniteKey,
      {
        pages: [
          {
            items: [row('2'), row('4')],
            page: 0,
            size: 20,
            totalElements: 2,
            totalPages: 1,
            hasNext: false,
          },
        ],
        pageParams: [0],
      }
    )

    applyDeletedSponsorsToLists(queryClient, '2')

    expect(queryClient.getQueryData<SponsorManagementRow[]>(optionsKey)?.map(item => item.id)).toEqual([
      '1',
    ])
    const infinite = queryClient.getQueryData<
      InfiniteData<DataManagementListPage<SponsorManagementRow>>
    >(infiniteKey)
    expect(infinite?.pages[0]?.items.map(item => item.id)).toEqual(['4'])
  })

  it('drops unused detail and nested caches after delete', () => {
    const queryClient = new QueryClient()
    const id = '12'
    const detailKey = dataManagementQueryKeys.sponsors.detail(id)
    const yearlyKey = dataManagementQueryKeys.sponsors.yearlyBusinesses(id)
    const contactsKey = dataManagementQueryKeys.sponsors.contacts(id, '')
    const historyKey = dataManagementQueryKeys.sponsors.programHistories(id, '')
    queryClient.setQueryData(detailKey, { id, name: '삭제' })
    queryClient.setQueryData(yearlyKey, [])
    queryClient.setQueryData(contactsKey, [])
    queryClient.setQueryData(historyKey, [])

    discardDeletedSponsorCaches(queryClient, id)

    expect(queryClient.getQueryData(detailKey)).toBeUndefined()
    expect(queryClient.getQueryData(yearlyKey)).toBeUndefined()
    expect(queryClient.getQueryData(contactsKey)).toBeUndefined()
    expect(queryClient.getQueryData(historyKey)).toBeUndefined()
  })
})
