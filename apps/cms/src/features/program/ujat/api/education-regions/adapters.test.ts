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
        code: 'SEOUL',
        nameKo: '서울시',
        displayName: '서울',
        displayOrder: 1,
        activeYn: true,
        hasUsageHistory: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        createdByName: '김등록',
        updatedByName: '이수정',
      })
    ).toMatchObject({
      id: '3',
      regionKey: 'SEOUL',
      name: '서울',
      sortOrder: 1,
      active: true,
      hasUsageHistory: true,
      createdByName: '김등록',
      updatedByName: '이수정',
    })
  })

  it('maps missing audit names to empty strings for UI dash', () => {
    expect(
      mapEducationRegionResponse({
        id: 1,
        code: 'busan',
        nameKo: '부산',
        createdByName: undefined,
        updatedByName: undefined,
      })
    ).toMatchObject({
      createdByName: '',
      updatedByName: '',
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
          updatedByName: '',
          createdAt: '',
          hasUsageHistory: false,
        },
      ]).items
    ).toEqual([{ id: 1, code: 'seoul', displayOrder: 1 }])
  })
})
