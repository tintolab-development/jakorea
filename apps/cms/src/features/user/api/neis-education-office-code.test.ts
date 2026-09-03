import { describe, expect, it } from 'vitest'
import { resolveNeisEducationOfficeCode } from './neis-education-office-code'

describe('resolveNeisEducationOfficeCode', () => {
  it('선택 시점 교육청 코드를 우선한다', () => {
    expect(
      resolveNeisEducationOfficeCode({
        provider: 'NEIS',
        educationOfficeCode: 'B10',
        regionSido: '경기도',
        externalSchoolCode: 'J100000001',
      })
    ).toBe('B10')
  })

  it('CAREER_NET이면 교육청 코드를 보내지 않는다', () => {
    expect(
      resolveNeisEducationOfficeCode({
        provider: 'CAREER_NET',
        educationOfficeCode: 'B10',
        regionSido: '서울특별시',
        externalSchoolCode: '1',
      })
    ).toBeUndefined()
  })

  it('명시 코드가 없으면 시/도 매핑으로 유도한다', () => {
    expect(
      resolveNeisEducationOfficeCode({
        provider: 'NEIS',
        regionSido: '서울특별시',
      })
    ).toBe('B10')
  })
})
