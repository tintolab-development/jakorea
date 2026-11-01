import { describe, expect, it } from 'vitest'
import { resolvePreferredRegionEducationCode } from './resolve-preferred-region-education-code'

const regions = [
  { key: 'seoul', label: '서울' },
  { key: 'gyeonggi_south', label: '경기(남부)' },
] as const

describe('resolvePreferredRegionEducationCode', () => {
  it('셀렉트 라벨을 educationRegionCode(regionKey)로 바꾼다', () => {
    expect(resolvePreferredRegionEducationCode('서울', regions)).toBe('seoul')
    expect(resolvePreferredRegionEducationCode('경기(남부)', regions)).toBe('gyeonggi_south')
  })

  it('이미 regionKey이면 그대로 반환한다', () => {
    expect(resolvePreferredRegionEducationCode('seoul', regions)).toBe('seoul')
    expect(resolvePreferredRegionEducationCode('SEOUL', regions)).toBe('seoul')
  })

  it('빈 값·미등록 라벨은 null이다', () => {
    expect(resolvePreferredRegionEducationCode('  ', regions)).toBeNull()
    expect(resolvePreferredRegionEducationCode('제주', regions)).toBeNull()
  })
})
