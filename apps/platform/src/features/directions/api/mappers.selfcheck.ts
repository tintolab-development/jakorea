import assert from 'node:assert/strict'
import { hasDirectionsContent, mapPublicDirections } from './mappers.ts'

const mapped = mapPublicDirections({
  koreanAddress: '서울특별시 강서구 마곡중앙로 171',
  englishAddress: '171 Magokjungang-ro, Gangseo-gu, Seoul',
  kakaoMapHtml: '<div id="daumRoughmapContainer1"></div>',
  phone: '02-783-2367',
  fax: '070-4275-5115',
  email: 'jakorea@jakorea.org',
})

assert.equal(mapped.addressKo, '서울특별시 강서구 마곡중앙로 171')
assert.equal(mapped.addressEn, '171 Magokjungang-ro, Gangseo-gu, Seoul')
assert.equal(mapped.phone, '02-783-2367')
assert.equal(mapped.fax, '070-4275-5115')
assert.equal(mapped.email, 'jakorea@jakorea.org')
assert.equal(mapped.updatedAt, '')
assert.equal(hasDirectionsContent(mapped), true)

assert.equal(
  hasDirectionsContent(
    mapPublicDirections({
      koreanAddress: '',
      englishAddress: '',
      phone: '',
      fax: '',
      email: '',
      kakaoMapHtml: '',
    }),
  ),
  false,
)

assert.equal(hasDirectionsContent(mapPublicDirections({})), false)

console.log('directions mapPublicDirections selfcheck: ok')
