import assert from 'node:assert/strict'
import { mapPublicTextbookListThumbnail } from './list-thumbnail.ts'

const w233 = 'https://cdn.example.com/textbook/1/w233.webp'
const w466 = 'https://cdn.example.com/textbook/1/w466.webp'

assert.deepEqual(mapPublicTextbookListThumbnail({ thumbnailUrlW233: w233, thumbnailUrlW466: w466 }), {
  src: w233,
  srcSet: `${w233} 1x, ${w466} 2x`,
})
assert.deepEqual(mapPublicTextbookListThumbnail({ thumbnailUrlW233: ` ${w233} `, thumbnailUrlW466: null }), {
  src: w233,
})
assert.deepEqual(mapPublicTextbookListThumbnail({ thumbnailUrlW233: null, thumbnailUrlW466: w466 }), {
  src: w466,
})
// 변형이 아직 없으면 카드가 원본 thumbnailUrl을 쓴다.
assert.equal(mapPublicTextbookListThumbnail({ thumbnailUrlW233: null, thumbnailUrlW466: null }), undefined)
assert.equal(mapPublicTextbookListThumbnail({}), undefined)
assert.equal(mapPublicTextbookListThumbnail({ thumbnailUrlW233: '  ', thumbnailUrlW466: '' }), undefined)

console.log('textbook list-thumbnail.selfcheck: ok')
