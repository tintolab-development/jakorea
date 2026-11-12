import { describe, expect, it } from 'vitest'
import {
  mapDetailedProgramListPage,
  mapDetailedProgramListResponse,
  mapDetailedProgramResponse,
  toDetailedProgramPatchRequest,
  toDetailedProgramRequest,
} from './detailed-program-adapters'

describe('detailed-program-adapters', () => {
  it('maps API response to UI row', () => {
    const row = mapDetailedProgramResponse({
      id: 42,
      nameKo: '1차 교육 워크숍',
      nameEn: 'Workshop',
      businessArea: '경제금융',
      useYn: true,
      createdByAdminId: 7,
      createdByName: '관리자',
      inUse: true,
      createdAt: '2026-03-30T01:10:32.000Z',
    })
    expect(row).toMatchObject({
      id: '42',
      name: '1차 교육 워크숍',
      active: true,
      createdBy: '관리자',
      inUse: true,
    })
    expect(row.version).toBeUndefined()
  })

  it('preserves version from the response and does not default to 1', () => {
    expect(mapDetailedProgramResponse({ id: 1, nameKo: 'A', version: 3 }).version).toBe(3)
    expect(mapDetailedProgramResponse({ id: 1, nameKo: 'A' }).version).toBeUndefined()
  })

  it('defaults missing inUse to false', () => {
    expect(mapDetailedProgramResponse({ id: 1, nameKo: 'A' }).inUse).toBe(false)
  })

  it('maps UI input to API request without businessArea', () => {
    expect(toDetailedProgramRequest({ name: '테스트', active: false })).toEqual({
      nameKo: '테스트',
      useYn: false,
    })
  })

  it('includes nameEn only when non-empty', () => {
    expect(toDetailedProgramRequest({ name: '테스트', active: true, nameEn: '  Test  ' })).toEqual({
      nameKo: '테스트',
      nameEn: 'Test',
      useYn: true,
    })
  })

  it('PATCH payload sends nameKo, useYn, and version', () => {
    expect(toDetailedProgramPatchRequest({ name: '테스트', active: true, version: 4 })).toEqual({
      nameKo: '테스트',
      useYn: true,
      version: 4,
    })
  })

  it('list mapper accepts Spring content alias', () => {
    const rows = mapDetailedProgramListResponse({
      content: [{ id: 1, nameKo: 'A', useYn: true }],
    } as Parameters<typeof mapDetailedProgramListResponse>[0] & {
      content: { id: number; nameKo: string; useYn: boolean }[]
    })
    expect(rows).toEqual([
      expect.objectContaining({ id: '1', name: 'A', active: true }),
    ])
  })

  it('QA-0363 서버 1페이지를 공통 페이지 형태로 바꾸고 다음 페이지 여부를 계산한다', () => {
    const first = mapDetailedProgramListPage({
      items: [{ id: 1, nameKo: 'A' }, { id: 2, nameKo: 'B' }],
      page: 0,
      size: 2,
      totalElements: 5,
      totalPages: 3,
    })
    expect(first.items.map(row => row.id)).toEqual(['1', '2'])
    expect(first.totalElements).toBe(5)
    expect(first.hasNext).toBe(true)

    const last = mapDetailedProgramListPage({
      items: [{ id: 5, nameKo: 'E' }],
      page: 2,
      size: 2,
      totalElements: 5,
      totalPages: 3,
    })
    expect(last.hasNext).toBe(false)
  })

  it('QA-0363 페이지 정보가 없으면 받은 행 수로 한 페이지로 본다', () => {
    const page = mapDetailedProgramListPage({ items: [{ id: 1, nameKo: 'A' }] })
    expect(page).toMatchObject({ page: 0, size: 20, totalElements: 1, totalPages: 1, hasNext: false })
  })
})
