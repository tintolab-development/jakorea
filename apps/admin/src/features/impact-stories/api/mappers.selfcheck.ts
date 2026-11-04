/**
 * Run:
 *   node --experimental-strip-types --experimental-transform-types \
 *     src/features/impact-stories/api/mappers.selfcheck.ts
 */
import assert from 'node:assert/strict'
import type { ImpactStoryCreateInput } from '../../../entities/impact-stories/model/types.ts'
import type { StoryResponse } from '../../../shared/api/generated/impact-story/schemas/storyResponse.ts'
import { mapStoryResponseToDomain, toStoryCreateRequest, toStoryUpdateRequest } from './mappers.ts'

const input: ImpactStoryCreateInput = {
  categoryId: '3',
  title: '  제목  ',
  contentMarkdown: '<p>본문</p>',
  isPublic: true,
  isPinned: false,
  publishedAt: '2026-10-28T00:00:00.000Z',
  authorName: '홍길동',
  thumbnail: {
    id: 'thumb-1',
    name: 'cover.jpg',
    mime: 'image/jpeg',
    assetId: 41,
  },
  attachments: [],
}

const created = toStoryCreateRequest(input, [], 41)
assert.equal(created.title, '제목')
assert.equal(created.categoryId, 3)
assert.equal(created.body, '<p>본문</p>')
assert.equal((created as unknown as { thumbnailAssetId: number }).thumbnailAssetId, 41)
assert.deepEqual(created.attachmentAssetIds, [])
assert.equal(created.thumbnailDistinctFromAttachments, false)
assert.equal('attachmentAssetId' in created, false)

assert.throws(() => toStoryCreateRequest(input, [], 0), /썸네일/)
assert.throws(() => toStoryCreateRequest(input, [41], 41), /서로 다른 파일/)

const updated = toStoryUpdateRequest({ ...input, id: '9' }, 2, [77, 78], 41)
assert.equal((updated as unknown as { thumbnailAssetId: number }).thumbnailAssetId, 41)
assert.deepEqual(updated.attachmentAssetIds, [77, 78])
assert.equal(updated.thumbnailDistinctFromAttachments, true)
assert.equal(updated.version, 2)

const mapped = mapStoryResponseToDomain({
  id: 9,
  title: '스토리',
  body: '<p>본문</p>',
  published: true,
  pinned: false,
  categoryId: 3,
  attachmentAssetIds: [77],
  attachments: [
    {
      assetId: 77,
      originalName: 'att.png',
      contentType: 'image/png',
      publicUrl: 'https://cdn.test/att.png',
    },
  ],
  thumbnail: {
    assetId: 41,
    originalName: 'cover.jpg',
    contentType: 'image/jpeg',
    publicUrl: 'https://cdn.test/cover.jpg',
  },
  thumbnailOriginalName: 'cover.jpg',
} as StoryResponse)

assert.equal(mapped.thumbnail?.assetId, 41)
assert.equal(mapped.thumbnail?.name, 'cover.jpg')
assert.equal(mapped.attachments[0]?.assetId, 77)

const attachmentOnly = mapStoryResponseToDomain({
  id: 10,
  title: '첨부만',
  body: '<p>본문</p>',
  attachmentAssetIds: [77, 88],
  attachments: [
    {
      assetId: 77,
      originalName: 'att.png',
      contentType: 'image/png',
      publicUrl: 'https://cdn.test/att.png',
    },
    {
      assetId: 88,
      originalName: '양식.hwp',
      contentType: 'application/x-hwp',
      publicUrl: 'https://cdn.test/form.hwp',
    },
  ],
})
assert.equal(attachmentOnly.thumbnail, null)
assert.equal(attachmentOnly.attachments.length, 2)
assert.equal(attachmentOnly.attachments[1]?.assetId, 88)

console.log('impact-stories mappers.selfcheck ok')
