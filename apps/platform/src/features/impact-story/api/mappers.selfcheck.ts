/**
 * 공개 임팩트 스토리 매퍼
 *
 * 필수 필드(id·title) 없는 행은 버린다.
 * placeholder 이미지 URL은 없는 것으로 본다.
 */
import assert from 'node:assert/strict'
import {
  featuredFromPreview,
  latestExcluding,
  mapPublicCategories,
  mapPublicStoryDetail,
  mapPublicStoryListItem,
  mapPublicStoryListItems,
} from './mappers.ts'

const categories = mapPublicCategories([
  { id: 1, name: '스토리' },
  { id: 2, name: ' 언론보도 ' },
  { id: 0, name: '무시' },
  { name: '보고서' },
])
assert.equal(categories.length, 2)
assert.equal(categories[0]?.name, '스토리')
assert.equal(categories[1]?.name, '언론보도')

const skipped = mapPublicStoryListItem({ title: '제목만' })
assert.equal(skipped, null)

const mapped = mapPublicStoryListItem({
  id: 42,
  pinned: true,
  publishAt: '2026-08-08T00:00:00.000Z',
  categoryName: '스토리',
  title: '14년 만에 심사위원으로! 민재님이 JA와 함께하는 이유',
  summary: '요약',
  imageUrl: 'https://cdn.example/card-minjae.png',
  viewCount: 12,
})
assert.ok(mapped)
assert.equal(mapped.id, '42')
assert.equal(mapped.category, 'story')
assert.equal(mapped.isFeatured, true)
assert.equal(mapped.summary, '요약')
assert.equal(mapped.imageUrl, 'https://cdn.example/card-minjae.png')
assert.match(mapped.publishedAtLabel, /2026년/)

const placeholder = mapPublicStoryListItem({
  id: 1,
  title: '표지 없음',
  imageUrl: 'https://cdn.example/impact-story-placeholder.png',
})
assert.ok(placeholder)
assert.equal(placeholder.imageUrl, undefined)

const noThumbnail = mapPublicStoryListItem({
  id: 2,
  title: '섬네일 없음',
})
assert.ok(noThumbnail)
assert.equal(noThumbnail.imageUrl, undefined)

const detail = mapPublicStoryDetail({
  id: 42,
  title: '민재',
  categoryName: '스토리',
  publishAt: '2026-08-08T00:00:00.000Z',
  body: '<p>본문</p>',
  viewCount: 9,
})
assert.ok(detail)
assert.equal(detail.bodyFormat, 'html')
assert.equal(detail.viewCount, 9)
assert.equal(detail.blocks.length, 0)

const pinned = featuredFromPreview([
  { ...mapped!, id: '1', isFeatured: true },
  { ...mapped!, id: '2', isFeatured: false },
  { ...mapped!, id: '3', isFeatured: true },
  { ...mapped!, id: '4', isFeatured: true },
  { ...mapped!, id: '5', isFeatured: true },
])
assert.deepEqual(
  pinned.map(item => item.id),
  ['1', '3', '4', '5']
)

const publicListPage = {
  items: [
    { id: 11, pinned: true, title: '민재', imageUrl: 'http://localhost:9000/cover.png' },
    { id: 9, pinned: true, title: '협약' },
    { id: 6, pinned: true, title: '페스티벌' },
    { id: 2, pinned: false, title: '커리큘럼' },
    { id: 7, pinned: false, title: '보고회' },
    { id: 4, pinned: false, title: '후기' },
    { id: 12, pinned: false, title: '개소식' },
    { id: 5, pinned: false, title: '인터뷰' },
    { id: 1, pinned: false, title: '스크랩' },
  ],
}
const fromPublicList = featuredFromPreview(mapPublicStoryListItems(publicListPage.items))
assert.deepEqual(
  fromPublicList.map(item => item.id),
  ['11', '9', '6']
)
assert.equal(fromPublicList[0]?.imageUrl, 'http://localhost:9000/cover.png')
assert.equal(fromPublicList[1]?.imageUrl, undefined)
assert.equal(fromPublicList[2]?.imageUrl, undefined)

const latest = latestExcluding(
  [
    { ...mapped!, id: '10', publishedAt: '2026-08-01T00:00:00.000Z', isFeatured: false },
    { ...mapped!, id: '11', publishedAt: '2026-08-10T00:00:00.000Z', isFeatured: false },
    { ...mapped!, id: '12', publishedAt: '2026-08-05T00:00:00.000Z', isFeatured: false },
  ],
  '11',
  2
)
assert.deepEqual(
  latest.map(item => item.id),
  ['12', '10']
)

console.log('map-public-impact-story.selfcheck: ok')
