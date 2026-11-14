import { AxiosError } from 'axios'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { axiosClient } from '../src/shared/api/axios-instance'
import {
  mapPortalAddressSearchItemToJuso,
  PORTAL_PUBLIC_ADDRESS_SEARCH_PATH,
  searchPortalAddresses,
} from '../src/shared/api/portal-address-search-client'
import { PLATFORM_ADDRESS_SEARCH_UNAVAILABLE_MESSAGE } from '../src/shared/lib/location-env'

function axiosErr(status: number, data: unknown) {
  return new AxiosError(`Request failed with status code ${status}`, undefined, undefined, undefined, {
    status,
    data,
    statusText: 'Error',
    headers: {},
    config: {} as never,
  })
}

describe('portal address search', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

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
      buildingName: '강남파이낸스센터',
      emdName: '역삼동',
      roadName: '테헤란로',
    })

    expect(mapped.zipNo).toBe('06234')
    expect(mapped.roadAddr).toBe('서울특별시 강남구 테헤란로 152')
    expect(mapped.jibunAddr).toBe('서울특별시 강남구 역삼동 737')
    expect(mapped.siNm).toBe('서울특별시')
    expect(mapped.sggNm).toBe('강남구')
    expect(mapped.engAddr).toBe('152, Teheran-ro, Gangnam-gu, Seoul')
    expect(mapped.emdNm).toBe('역삼동')
    expect(mapped.rn).toBe('테헤란로')
  })

  it('treats inputErrorCode (검색어 거절) as an empty result', async () => {
    vi.spyOn(axiosClient, 'get').mockResolvedValue({
      data: { success: true, data: { content: [], totalElements: 0, inputErrorCode: 'E0008' } },
    })
    await expect(searchPortalAddresses({ keyword: '!!' })).resolves.toEqual({
      addresses: [],
      totalCount: 0,
    })
  })

  it.each([
    [502, 'ADDRESS_SEARCH_UPSTREAM_FAILED'],
    [504, 'ADDRESS_SEARCH_TIMEOUT'],
  ])('uses the existing unavailable copy for %i %s', async (status, code) => {
    vi.spyOn(axiosClient, 'get').mockRejectedValue(
      axiosErr(status, { success: false, error: { code, message: 'upstream' } }),
    )
    await expect(searchPortalAddresses({ keyword: '테헤란로' })).rejects.toThrow(
      PLATFORM_ADDRESS_SEARCH_UNAVAILABLE_MESSAGE,
    )
  })
})
