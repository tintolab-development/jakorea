/**
 * Run:
 *   node --experimental-strip-types --experimental-transform-types \
 *     src/features/notices/api/mappers.selfcheck.ts
 */
import assert from 'node:assert/strict'
import type { NoticeCreateInput } from '../../../entities/notices/model/types.ts'
import type { NoticeResponse } from '../../../shared/api/generated/ja-korea/schemas/noticeResponse.ts'
import { mapNoticeResponseToDomain, toNoticeCreateRequest, toNoticeUpdateRequest } from './mappers.ts'

const input: NoticeCreateInput = {
  title: '  첨부 2건 공지  ',
  contentMarkdown: '<p>본문</p>',
  isPublic: false,
  isPinned: false,
  publishedAt: '2026-11-04T01:30:00Z',
  authorName: '관리자',
  attachments: [],
}

const createdEmpty = toNoticeCreateRequest(input, [])
assert.deepEqual(createdEmpty.attachmentAssetIds, [])
assert.equal('attachmentAssetId' in createdEmpty, false)

const created = toNoticeCreateRequest(input, [101, 102])
assert.deepEqual(created.attachmentAssetIds, [101, 102])
assert.equal(created.title, '첨부 2건 공지')

const updated = toNoticeUpdateRequest({ ...input, id: '9' }, 3, [])
assert.deepEqual(updated.attachmentAssetIds, [])
assert.equal(updated.version, 3)

const mapped = mapNoticeResponseToDomain({
  id: 9,
  title: '첨부 2건 공지',
  body: '<p>본문</p>',
  attachmentAssetIds: [101, 102],
  attachments: [
    {
      assetId: 101,
      purpose: 'JA_NOTICE_ATTACHMENT',
      status: 'READY',
      originalName: '안내.pdf',
      contentType: 'application/pdf',
      sizeBytes: 204800,
      publicUrl: 'https://cdn.example/notice-1.pdf',
    },
    {
      assetId: 102,
      purpose: 'JA_NOTICE_ATTACHMENT',
      status: 'READY',
      originalName: '양식.hwp',
      contentType: 'application/x-hwp',
      sizeBytes: 102400,
      publicUrl: 'https://cdn.example/notice-2.hwp',
    },
  ],
} as NoticeResponse)

assert.equal(mapped.attachments.length, 2)
assert.equal(mapped.attachments[0]?.assetId, 101)
assert.equal(mapped.attachments[1]?.name, '양식.hwp')

const empty = mapNoticeResponseToDomain({
  id: 10,
  title: '없음',
  body: '<p></p>',
  attachmentAssetIds: [],
  attachments: [],
} as NoticeResponse)
assert.deepEqual(empty.attachments, [])

console.log('notices mappers.selfcheck ok')
