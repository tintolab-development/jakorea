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

const created = toCareerPostingCreateRequest(baseInput)
assert.equal(created.title, '교육사업팀 프로그램 매니저 채용')
assert.equal(created.status, 'RECRUITING')
assert.equal('buttonLabel' in created, false)
assert.equal('linkUrl' in created, false)
assert.equal('version' in created, false)

const cleared = toCareerPostingUpdateRequest(
  { ...baseInput, id: '12', buttonLabel: '  ', linkUrl: '' } satisfies RecruitPostingUpdateInput,
  3,
)
assert.equal(cleared.version, 3)
assert.equal('buttonLabel' in cleared, false)
assert.equal('linkUrl' in cleared, false)
assert.equal(cleared.status, 'RECRUITING')

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
})
assert.equal(detail?.buttonLabel, '')
assert.equal(detail?.linkUrl, '')
assert.equal(detail?.version, 3)

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
})
assert.equal(partial?.buttonLabel, '')
assert.equal(partial?.linkUrl, '')

console.log('recruit-posting mappers selfcheck: ok')
