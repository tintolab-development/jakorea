import { describe, expect, it } from 'vitest'

import {
  mapPortalAddressSearchItemToJuso,
  PORTAL_PUBLIC_ADDRESS_SEARCH_PATH,
} from './portal-address-search-client'

describe('portal address search (CMS)', () => {
  it('uses OpenAPI path', () => {
    expect(PORTAL_PUBLIC_ADDRESS_SEARCH_PATH).toBe('/api/portal/public/addresses/search')
  })

  it('maps backend fields to JusoAddressItem', () => {
    const mapped = mapPortalAddressSearchItemToJuso({
      zipcode: '06234',
      roadAddress: '서울특별시 강남구 테헤란로 152',
      jibunAddress: '서울특별시 강남구 역삼동 737',
      englishAddress: '152, Teheran-ro, Gangnam-gu, Seoul',
      sido: '서울특별시',
      sigungu: '강남구',
    })

    expect(mapped.zipNo).toBe('06234')
    expect(mapped.roadAddr).toBe('서울특별시 강남구 테헤란로 152')
    expect(mapped.jibunAddr).toBe('서울특별시 강남구 역삼동 737')
    expect(mapped.siNm).toBe('서울특별시')
    expect(mapped.sggNm).toBe('강남구')
    expect(mapped.engAddr).toBe('152, Teheran-ro, Gangnam-gu, Seoul')
  })
})
