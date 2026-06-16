import { describe, expect, it } from 'vitest'
import {
  mapDetailedProgramResponse,
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
      createdAt: '2026-03-30T01:10:32.000Z',
    })
    expect(row).toMatchObject({
      id: '42',
      name: '1차 교육 워크숍',
      active: true,
      createdBy: '7',
      inUse: false,
    })
  })

  it('maps UI input to API request', () => {
    expect(toDetailedProgramRequest({ name: '테스트', active: false })).toEqual({
      nameKo: '테스트',
      nameEn: '',
      businessArea: 'GENERAL',
      useYn: false,
    })
  })
})
