import { describe, expect, it } from 'vitest'
import {
  SEND_HISTORY_PAGE_SIZE,
  toSendHistoryListPage,
  withSendHistoryPaging,
} from '@/features/notifications/api/delivery-list-page'

describe('send history paging', () => {
  it('page는 0부터, size는 20', () => {
    expect(withSendHistoryPaging({ channelType: 'SMS' }, 0)).toEqual({
      channelType: 'SMS',
      page: '0',
      size: '20',
    })
    expect(withSendHistoryPaging({}, 2).page).toBe('2')
    expect(SEND_HISTORY_PAGE_SIZE).toBe(20)
  })

  it('totalCount가 size를 넘으면 다음 페이지가 있다', () => {
    const page = toSendHistoryListPage({ items: [{}, {}], totalCount: 41, page: 0, size: 20 }, 0, items => items ?? [])
    expect(page.hasNext).toBe(true)
    expect(page.totalCount).toBe(41)
  })

  it('마지막 페이지는 hasNext가 false', () => {
    const page = toSendHistoryListPage({ items: [{}], totalCount: 21, page: 1, size: 20 }, 1, items => items ?? [])
    expect(page.hasNext).toBe(false)
  })

  it('totalCount가 없으면 가득 찬 페이지를 다음 페이지로 본다', () => {
    const full = toSendHistoryListPage(
      { items: Array.from({ length: 20 }, () => ({})) },
      0,
      items => items ?? []
    )
    expect(full.totalCount).toBeNull()
    expect(full.hasNext).toBe(true)

    const short = toSendHistoryListPage({ items: [{}] }, 0, items => items ?? [])
    expect(short.hasNext).toBe(false)
  })
})
