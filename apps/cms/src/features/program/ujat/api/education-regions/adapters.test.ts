import { describe, expect, it } from 'vitest'
import {
  mapEducationRegionResponse,
  mapEducationRegionReorderRequest,
  mapEducationRegionUpdateRequest,
} from './adapters'

describe('ujat education-regions adapters', () => {
  it('maps OpenAPI response to FE domain', () => {
    expect(
      mapEducationRegionResponse({
        id: 3,
        code: 'seoul',
        nameKo: '서울',
        displayOrder: 1,
        activeYn: true,
        createdAt: '2026-01-01T00:00:00.000Z',
      })
    ).toMatchObject({
      id: '3',
      regionKey: 'seoul',
      name: '서울',
      sortOrder: 1,
      active: true,
      hasUsageHistory: false,
    })
  })

  it('maps update and reorder bodies', () => {
    expect(mapEducationRegionUpdateRequest({ name: '인천', active: false })).toEqual({
      nameKo: '인천',
      displayName: '인천',
      activeYn: false,
      displayOrder: undefined,
    })
    expect(
      mapEducationRegionReorderRequest([
        {
          id: '1',
          regionKey: 'seoul',
          sortOrder: 1,
          active: true,
          name: '서울',
          createdByName: '',
          createdAt: '',
          hasUsageHistory: false,
        },
      ]).items
    ).toEqual([{ id: 1, code: 'seoul', displayOrder: 1 }])
  })
})
