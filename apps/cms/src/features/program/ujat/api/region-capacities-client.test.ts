import { describe, expect, it } from 'vitest'
import { UJAT_REGION_CAPACITY_OVERLAY_KEY } from '@/features/program/ujat/lib/ujat-region-capacity-types'
import { buildUjatRegionCapacityOverlay } from './region-capacities-client'

describe('buildUjatRegionCapacityOverlay', () => {
  it('서버의 반기·지역 코드별 정원을 상세 overlay의 지역 라벨로 변환한다', () => {
    const overlay = buildUjatRegionCapacityOverlay([
      {
        semesterType: 'FIRST_HALF',
        educationRegionCode: 'SEOUL',
        maxClassCount: 20,
        maxVolunteerCount: 40,
      },
      {
        semesterType: 'SECOND_HALF',
        educationRegionCode: 'JEONBUK_JEONJU',
        maxClassCount: 2,
        maxVolunteerCount: 8,
      },
    ])

    expect(overlay).toEqual({
      [UJAT_REGION_CAPACITY_OVERLAY_KEY]: {
        h1: { 서울: { classCount: '20', volunteerCount: '40' } },
        h2: { '전북(전주)': { classCount: '2', volunteerCount: '8' } },
      },
    })
  })
})
