import { describe, expect, it } from 'vitest'
import { toUjatEducationRegionCode } from './ujat-education-region-code'

describe('toUjatEducationRegionCode', () => {
  it('탭 regionKey를 목록·배정 API educationRegionCode로 올린다', () => {
    expect(toUjatEducationRegionCode('seoul')).toBe('SEOUL')
    expect(toUjatEducationRegionCode('gyeonggi_south')).toBe('GYEONGGI_SOUTH')
    expect(toUjatEducationRegionCode('daegu')).toBe('DAEGU')
    expect(toUjatEducationRegionCode('jeonbuk_jeonju')).toBe('JEONBUK_JEONJU')
  })

  it('이미 서버 코드면 그대로 둔다', () => {
    expect(toUjatEducationRegionCode('GYEONGGI_SOUTH')).toBe('GYEONGGI_SOUTH')
  })
})
