import { describe, expect, it } from 'vitest'
import {
  resolveUjatRegionCapacityBySemester,
  resolveUjatRegionCapacitySemesterValues,
} from './ujat-region-capacity-display'
import { UJAT_REGION_CAPACITY_OVERLAY_KEY } from './ujat-region-capacity-types'

describe('resolveUjatRegionCapacitySemesterValues', () => {
  it('신규 등록 폼(overlay 비어 있음)에서는 지역별 목업 숫자가 노출되지 않는다 (버그 수정 확인)', () => {
    const h1 = resolveUjatRegionCapacitySemesterValues('h1', {})
    const h2 = resolveUjatRegionCapacitySemesterValues('h2', {})

    for (const region of Object.keys(h1)) {
      const values = h1[region as keyof typeof h1]
      expect(values?.classCount).toBe('')
      expect(values?.volunteerCount).toBe('')
    }
    for (const region of Object.keys(h2)) {
      const values = h2[region as keyof typeof h2]
      expect(values?.classCount).toBe('')
      expect(values?.volunteerCount).toBe('')
    }
  })

  it('실제 저장된 overlay 값이 있으면 그대로 반영한다', () => {
    const overlay = {
      [UJAT_REGION_CAPACITY_OVERLAY_KEY]: {
        h1: { 서울: { classCount: '10', volunteerCount: '20' } },
        h2: {},
      },
    }
    const result = resolveUjatRegionCapacityBySemester(overlay)
    const seoul = result.h1['서울' as keyof typeof result.h1]
    expect(seoul?.classCount).toBe('10')
    expect(seoul?.volunteerCount).toBe('20')
  })
})
