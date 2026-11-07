import assert from 'node:assert/strict'
import { hasIncompleteRequiredDirectionsFields } from './required-fields.ts'

const filled = {
  addressKo: '서울',
  addressEn: 'Seoul',
  kakaoMapHtml: '<div id="daumRoughmapContainer"></div>',
  phone: '02-783-2367',
  fax: '02-783-0000',
  email: 'a@b.com',
}

assert.equal(hasIncompleteRequiredDirectionsFields(filled), false)
assert.equal(hasIncompleteRequiredDirectionsFields({ ...filled, addressKo: '  ' }), true)
assert.equal(hasIncompleteRequiredDirectionsFields({ ...filled, addressEn: '' }), true)
assert.equal(hasIncompleteRequiredDirectionsFields({ ...filled, kakaoMapHtml: '\n' }), true)
assert.equal(hasIncompleteRequiredDirectionsFields({ ...filled, phone: '' }), true)
assert.equal(hasIncompleteRequiredDirectionsFields({ ...filled, fax: '' }), true)
assert.equal(hasIncompleteRequiredDirectionsFields({ ...filled, email: '   ' }), true)

console.log('directions required-fields.selfcheck: ok')
