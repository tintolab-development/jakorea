/**
 * 카테고리 list/create 응답 정규화
 */
import assert from 'node:assert/strict'
import {
  normalizeCategoryListPayload,
  normalizeCategoryPayload,
} from './category-payload.ts'

const raw = [
  { id: 1, name: '스토리', version: 0, storyCount: 3 },
  { id: 0, name: '무시' },
  { id: 2, name: '언론보도', version: 1 },
]
assert.deepEqual(
  normalizeCategoryListPayload(raw).map(r => r.name),
  ['스토리', '언론보도'],
)

const enveloped = {
  success: true,
  data: [
    { id: 3, name: '보고서' },
    { id: 4, name: '영상' },
  ],
}
assert.deepEqual(
  normalizeCategoryListPayload(enveloped).map(r => r.id),
  [3, 4],
)

const paged = { items: [{ id: 5, name: '뉴스레터' }] }
assert.equal(normalizeCategoryListPayload(paged)[0]?.name, '뉴스레터')

const nested = { success: true, data: { items: [{ id: 6, name: '스토리' }] } }
assert.equal(normalizeCategoryListPayload(nested)[0]?.id, 6)

assert.equal(normalizeCategoryListPayload({ success: true, data: [] }).length, 0)
assert.equal(normalizeCategoryListPayload(null).length, 0)

const created = normalizeCategoryPayload({
  success: true,
  data: { id: 10, name: '새 카테고리', version: 0 },
})
assert.equal(created.id, 10)
assert.equal(created.name, '새 카테고리')

assert.throws(() => normalizeCategoryPayload({ success: true, data: {} }))

console.log('category-payload.selfcheck ok')
