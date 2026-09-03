import { describe, expect, it } from 'vitest'
import {
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
      businessArea: 'GENERAL',
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
  })

  it('defaults missing inUse to false', () => {
    expect(mapDetailedProgramResponse({ id: 1, nameKo: 'A' }).inUse).toBe(false)
  })

  it('maps UI input to API request', () => {
    expect(toDetailedProgramRequest({ name: '테스트', active: false })).toEqual({
      nameKo: '테스트',
      nameEn: '',
      businessArea: 'GENERAL',
      useYn: false,
    })
  })

  it('PATCH payload sends only nameKo and useYn', () => {
    expect(toDetailedProgramPatchRequest({ name: '테스트', active: true })).toEqual({
      nameKo: '테스트',
      useYn: true,
    })
  })
})
