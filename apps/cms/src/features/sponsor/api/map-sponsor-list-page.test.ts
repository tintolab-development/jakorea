import { describe, expect, it } from 'vitest'
import { mapSponsorListPage } from './map-sponsor-list-page'

describe('mapSponsorListPage', () => {
  it('maps PageResponse items and totalElements', () => {
    const page = mapSponsorListPage({
      items: [
        {
          id: '163301',
          name: '제이에이코리아',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ],
      page: 0,
      size: 20,
      totalElements: 93,
      totalPages: 5,
    })

    expect(page.items).toHaveLength(1)
    expect(page.items[0]?.id).toBe('163301')
    expect(page.totalElements).toBe(93)
    expect(page.hasNext).toBe(true)
  })

  it('treats legacy array responses as a single page', () => {
    const page = mapSponsorListPage([
      {
        id: '1',
        name: 'A',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ])

    expect(page.items).toHaveLength(1)
    expect(page.totalElements).toBe(1)
    expect(page.hasNext).toBe(false)
  })
})
