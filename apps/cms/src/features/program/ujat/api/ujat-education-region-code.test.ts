import { describe, expect, it } from 'vitest'
import { fromUjatEducationRegionCode, toUjatEducationRegionCode } from './ujat-education-region-code'

describe('toUjatEducationRegionCode', () => {
  it('탭 regionKey를 목록·배정 API educationRegionCode로 올린다', () => {
    expect(toUjatEducationRegionCode('seoul')).toBe('SEOUL')
    expect(toUjatEducationRegionCode('gyeonggi_south')).toBe('GYEONGGI_SOUTH')
    expect(toUjatEducationRegionCode('daegu')).toBe('DAEGU')
    expect(toUjatEducationRegionCode('jeonbuk_jeonju')).toBe('JEONBUK_JEONJU')
  })

  it('이미 서버 코드면 그대로 둔다', () => {
    expect(toUjatEducationRegionCode('GYEONGGI_SOUTH')).toBe('GYEONGGI_SOUTH')
    expect(toUjatEducationRegionCode('CUSTOM_1793704314696')).toBe('CUSTOM_1793704314696')
  })

  it('빈 값을 서울로 바꾸지 않는다', () => {
    expect(toUjatEducationRegionCode('')).toBe('')
    expect(toUjatEducationRegionCode('   ')).toBe('')
  })
})

describe('fromUjatEducationRegionCode', () => {
  it('마스터 code를 소문자·서울로 바꾸지 않는다', () => {
    expect(fromUjatEducationRegionCode('SEOUL')).toBe('SEOUL')
    expect(fromUjatEducationRegionCode('CUSTOM_1793704314696')).toBe('CUSTOM_1793704314696')
    expect(fromUjatEducationRegionCode(null)).toBe('')
    expect(fromUjatEducationRegionCode('  ')).toBe('')
  })
})
