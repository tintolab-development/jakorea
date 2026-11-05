import { describe, expect, it } from 'vitest'
import { UJAT_INSTITUTION_EDUCATION_REGION_PARAM } from '@/features/program/ujat/lib/ujat-program-detail-url'
import {
  applyUjatInstitutionEducationRegionParam,
  parseUjatInstitutionEducationRegionParam,
  resolveUjatInstitutionEducationRegionKey,
} from './region-query'

describe('UJAT 기관 신청 지역 URL', () => {
  it('API 코드와 regionKey를 탭 키로 읽는다', () => {
    expect(parseUjatInstitutionEducationRegionParam('GYEONGGI_SOUTH')).toBe('GYEONGGI_SOUTH')
    expect(parseUjatInstitutionEducationRegionParam('CUSTOM_1793704314696')).toBe(
      'CUSTOM_1793704314696'
    )
    expect(parseUjatInstitutionEducationRegionParam('unknown-region')).toBeNull()
  })

  it('탭 키를 educationRegion=서버코드로 쓴다', () => {
    const next = new URLSearchParams()
    applyUjatInstitutionEducationRegionParam(next, 'gyeonggi_south')
    expect(next.get(UJAT_INSTITUTION_EDUCATION_REGION_PARAM)).toBe('GYEONGGI_SOUTH')
    expect(resolveUjatInstitutionEducationRegionKey(next)).toBe('GYEONGGI_SOUTH')
  })
})
