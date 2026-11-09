/**
 * Run:
 *   node --experimental-strip-types --experimental-transform-types \
 *     src/features/recruit-posting/api/mappers.selfcheck.ts
 */
import assert from 'node:assert/strict'
import type {
  RecruitPostingCreateInput,
  RecruitPostingUpdateInput,
} from '../../../entities/recruit-posting/model/types.ts'
import {
  mapCareerPostingAdminDetail,
  mapCareerPostingAdminItem,
  toCareerPostingCreateRequest,
  toCareerPostingUpdateRequest,
} from './mappers.ts'

const baseInput: RecruitPostingCreateInput = {
  title: '교육사업팀 프로그램 매니저 채용',
  contentMarkdown: '<p>본문</p>',
  isPublic: true,
  status: 'recruiting',
  publishedAt: '2026-05-08',
  recruitStart: '2026-04-03',
  recruitEnd: '2026-11-20',
  authorName: '인사팀',
  attachments: [],
  buttonLabel: '  지원하기  ',
  linkUrl: ' https://jobs.example.test ',
}

const created = toCareerPostingCreateRequest(baseInput, [])
assert.equal(created.title, '교육사업팀 프로그램 매니저 채용')
assert.equal(created.status, 'RECRUITING')
assert.equal(created.buttonLabel, '지원하기')
assert.equal(created.linkUrl, 'https://jobs.example.test')
assert.deepEqual(created.attachmentAssetIds, [])
assert.equal('attachmentAssetId' in created, false)
assert.equal('version' in created, false)
assert.equal('buttonLabel' in created, true)
assert.equal('linkUrl' in created, true)

const cleared = toCareerPostingUpdateRequest(
  { ...baseInput, id: '12', buttonLabel: '  ', linkUrl: '' } satisfies RecruitPostingUpdateInput,
  3,
  [301, 302],
)
assert.equal(cleared.version, 3)
assert.equal(cleared.buttonLabel, '')
assert.equal(cleared.linkUrl, '')
assert.equal(cleared.status, 'RECRUITING')
assert.deepEqual(cleared.attachmentAssetIds, [301, 302])

assert.equal(created.recruitStart, '2026-04-03')
assert.equal(created.recruitEnd, '2026-11-20')

// RESULT — 모집기간은 값이 있어도 null로 보낸다
const resultCreated = toCareerPostingCreateRequest({ ...baseInput, status: 'result' }, [])
assert.equal(resultCreated.status, 'RESULT')
assert.equal(resultCreated.recruitStart, null)
assert.equal(resultCreated.recruitEnd, null)
const resultUpdated = toCareerPostingUpdateRequest(
  { ...baseInput, id: '12', status: 'result', recruitStart: '', recruitEnd: '' },
  4,
)
assert.equal(resultUpdated.recruitStart, null)
assert.equal(resultUpdated.recruitEnd, null)

// CLOSED — 기간 유지, 빈 값은 "" 대신 null
const closedUpdated = toCareerPostingUpdateRequest({ ...baseInput, id: '12', status: 'closed' }, 4)
assert.equal(closedUpdated.status, 'CLOSED')
assert.equal(closedUpdated.recruitStart, '2026-04-03')
assert.equal(closedUpdated.recruitEnd, '2026-11-20')
const emptyRecruiting = toCareerPostingCreateRequest({ ...baseInput, recruitStart: '', recruitEnd: '' })
assert.equal(emptyRecruiting.recruitStart, null)
assert.equal(emptyRecruiting.recruitEnd, null)

// RESULT 응답 기간 null → 도메인 빈 문자열
const resultListItem = mapCareerPostingAdminItem({
  id: 21,
  status: 'RESULT',
  title: '결과 발표',
  isPublic: true,
  authorName: '인사팀',
  publishedOn: '2026-05-08',
  recruitStart: null,
  recruitEnd: null,
  version: 1,
})
assert.equal(resultListItem?.recruitStart, '')
assert.equal(resultListItem?.recruitEnd, '')

const detail = mapCareerPostingAdminDetail({
  id: 12,
  status: 'RECRUITING',
  title: '교육사업팀 프로그램 매니저 채용',
  isPublic: true,
  authorName: '인사팀',
  publishedOn: '2026-05-08',
  recruitStart: '2026-04-03',
  recruitEnd: '2026-11-20',
  createdAt: '2026-04-01T00:00:00',
  version: 3,
  body: '<p>본문</p>',
  buttonLabel: '  지원하기  ',
  linkUrl: ' https://jobs.example.test ',
  attachmentAssetIds: [9, 10],
  attachments: [
    {
      assetId: 9,
      originalName: '모집요강.pdf',
      contentType: 'application/pdf',
      publicUrl: 'https://example.test/file.pdf',
    },
    {
      assetId: 10,
      originalName: '양식.hwp',
      contentType: 'application/x-hwp',
      publicUrl: 'https://example.test/form.hwp',
    },
  ],
})
assert.equal(detail?.buttonLabel, '지원하기')
assert.equal(detail?.linkUrl, 'https://jobs.example.test')
assert.equal(detail?.version, 3)
assert.equal(detail?.attachments.length, 2)
assert.equal(detail?.attachments[1]?.assetId, 10)

const legacy = mapCareerPostingAdminDetail({
  id: 1,
  status: 'RESULT',
  title: '기존 공고',
  isPublic: false,
  authorName: '인사팀',
  publishedOn: '2025-01-01',
  recruitStart: '2025-01-01',
  recruitEnd: '2025-01-31',
  version: 1,
  body: '',
})
assert.equal(legacy?.buttonLabel, '')
assert.equal(legacy?.linkUrl, '')

const nullCta = mapCareerPostingAdminDetail({
  id: 2,
  status: 'RECRUITING',
  title: 'CTA null',
  isPublic: true,
  authorName: '인사팀',
  publishedOn: '2026-05-08',
  recruitStart: '2026-04-03',
  recruitEnd: '2026-11-20',
  version: 1,
  body: '<p>본문</p>',
  buttonLabel: null,
  linkUrl: null,
})
assert.equal(nullCta?.buttonLabel, '')
assert.equal(nullCta?.linkUrl, '')

const partial = mapCareerPostingAdminDetail({
  id: 3,
  status: 'RECRUITING',
  title: '부분 CTA',
  isPublic: true,
  authorName: '인사팀',
  publishedOn: '2026-05-08',
  recruitStart: '2026-04-03',
  recruitEnd: '2026-11-20',
  version: 1,
  body: '<p>본문</p>',
  buttonLabel: null,
  linkUrl: 'https://jobs.example.test',
})
assert.equal(partial?.buttonLabel, '')
assert.equal(partial?.linkUrl, 'https://jobs.example.test')

const listItem = mapCareerPostingAdminItem({
  id: 11,
  status: 'RECRUITING',
  title: '목록',
  isPublic: true,
  authorName: '인사팀',
  publishedOn: '2026-05-08',
  recruitStart: '2026-04-03',
  recruitEnd: '2026-11-20',
  version: 1,
})
assert.equal(listItem?.buttonLabel, '')
assert.equal(listItem?.linkUrl, '')

console.log('recruit-posting mappers selfcheck: ok')
