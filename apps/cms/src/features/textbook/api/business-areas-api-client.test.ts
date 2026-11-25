import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchTextbookBusinessAreasRemote } from './business-areas-api-client'

const { list1 } = vi.hoisted(() => ({ list1: vi.fn() }))
vi.mock('@/features/data-management/api/data-management-subset-api', () => ({
  getDataManagementSubsetApi: () => ({ list1 }),
}))

const items = (start: number, count: number) =>
  Array.from({ length: count }, (_, i) => ({ id: String(start + i), name: '분야 ' + (start + i) }))

describe('business area catalog pagination', () => {
  beforeEach(() => list1.mockReset())

  it('loads all pages with the requested authorization-safe options', async () => {
    list1.mockResolvedValueOnce({ page: 0, totalPages: 2, totalElements: 21, items: items(1, 20) })
      .mockResolvedValueOnce({ page: 1, totalPages: 2, totalElements: 21, items: items(21, 1) })
    const options = { skipGlobalErrorAlert: true }
    expect(await fetchTextbookBusinessAreasRemote(options)).toEqual(items(1, 21))
    expect(list1).toHaveBeenNthCalledWith(1, { page: 0, size: 20 }, options)
    expect(list1).toHaveBeenNthCalledWith(2, { page: 1, size: 20 }, options)
  })

  it('returns a genuinely empty list without inventing options', async () => {
    list1.mockResolvedValueOnce({ page: 0, totalPages: 0, totalElements: 0, items: [] })
    expect(await fetchTextbookBusinessAreasRemote()).toEqual([])
  })

  it('rejects rather than returning a partial list on later-page failure', async () => {
    list1.mockResolvedValueOnce({ page: 0, totalPages: 2, totalElements: 21, items: items(1, 20) })
      .mockRejectedValueOnce(new Error('network'))
    await expect(fetchTextbookBusinessAreasRemote()).rejects.toThrow('network')
  })

  it('rejects repeated IDs and changed totals', async () => {
    list1.mockResolvedValueOnce({ page: 0, totalPages: 2, totalElements: 21, items: items(1, 20) })
      .mockResolvedValueOnce({ page: 1, totalPages: 2, totalElements: 21, items: items(20, 1) })
    await expect(fetchTextbookBusinessAreasRemote()).rejects.toThrow('목록이 변경')
    list1.mockReset()
    list1.mockResolvedValueOnce({ page: 0, totalPages: 2, totalElements: 21, items: items(1, 20) })
      .mockResolvedValueOnce({ page: 1, totalPages: 1, totalElements: 20, items: [] })
    await expect(fetchTextbookBusinessAreasRemote()).rejects.toThrow('목록이 변경')
  })

  it('rejects malformed, mismatched and unexpectedly empty intermediate pages', async () => {
    list1.mockResolvedValueOnce({ page: 0 })
    await expect(fetchTextbookBusinessAreasRemote()).rejects.toThrow('페이지 응답')
    list1.mockResolvedValueOnce({ page: 1, items: [] })
    await expect(fetchTextbookBusinessAreasRemote()).rejects.toThrow('페이지 응답')
    list1.mockResolvedValueOnce({ page: 0, totalPages: 2, items: [] })
    await expect(fetchTextbookBusinessAreasRemote()).rejects.toThrow('목록이 변경')
  })
})
