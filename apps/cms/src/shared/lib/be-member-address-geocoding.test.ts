import { describe, expect, it } from 'vitest'
import {
  formatMemberAddressForBeGeocodingQuery,
  pickJusoRoadAddressLine,
} from '@jakorea/location/juso'

describe('BE member address geocoding helpers', () => {
  it('builds geocoding query without zip', () => {
    expect(
      formatMemberAddressForBeGeocodingQuery('서울특별시 강서구 마곡중앙로 171', '101동 1204호')
    ).toBe('서울특별시 강서구 마곡중앙로 171 101동 1204호')
  })

  it('prefers roadAddr for Juso selection', () => {
    expect(
      pickJusoRoadAddressLine('서울특별시 강서구 마곡중앙로 171', '서울특별시 강서구 마곡동 123')
    ).toBe('서울특별시 강서구 마곡중앙로 171')
  })
})
