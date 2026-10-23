import { describe, expect, it } from 'vitest'
import {
  fetchAllPerformanceRecordPages,
  parsePerformanceRecordPage,
} from './performance-api-client'
import type { ListRecordsParams, PerformanceRecordFrontendResponse } from '@/shared/api/generated/performance/schemas'

function records(count: number): PerformanceRecordFrontendResponse[] {
  return Array.from({ length: count }, (_, index) => ({ id: String(index + 1) }))
}

function pagedRecords(count: number, page: number, size: number): PerformanceRecordFrontendResponse[] {
  return records(count).slice(page * size, (page + 1) * size)
}

describe('performance-api-client', () => {
  it('parses both raw array and page metadata responses', () => {
    expect(parsePerformanceRecordPage([{ id: 1 }])).toEqual({ content: [{ id: 1 }] })
    expect(
      parsePerformanceRecordPage({ content: [{ id: 1 }], totalElements: 21, totalPages: 2 })
    ).toEqual({ content: [{ id: 1 }], totalElements: 21, totalPages: 2 })
  })

  it.each([0, 1, 20, 21, 100])(
    'collects all %s records without increasing the requested page size',
    async count => {
      const calls: ListRecordsParams[] = []
      const result = await fetchAllPerformanceRecordPages(
        async params => {
          calls.push(params)
          return pagedRecords(count, params.page ?? 0, params.size ?? 20)
        },
        { page: 0, size: 20 }
      )

      expect(result.records).toHaveLength(count)
      expect(result.totalElements).toBe(count)
      expect(calls.every(call => call.size === 20)).toBe(true)
      expect(calls.map(call => call.page)).toEqual(
        count === 0 ? [0] : Array.from({ length: Math.floor(count / 20) + 1 }, (_, i) => i)
      )
    }
  )

  it('stops by totalElements when the server returns page metadata', async () => {
    const calls: ListRecordsParams[] = []
    const result = await fetchAllPerformanceRecordPages(
      async params => {
        calls.push(params)
        return {
          content: pagedRecords(100, params.page ?? 0, params.size ?? 20),
          totalElements: 100,
          totalPages: 5,
        }
      },
      { page: 0, size: 20 }
    )

    expect(result.records).toHaveLength(100)
    expect(calls.map(call => call.page)).toEqual([0, 1, 2, 3, 4])
  })
})
