/**
 * 직무 인터뷰 Remote API 계약
 *
 * Run:
 *   node --experimental-strip-types --experimental-transform-types \
 *     src/features/recruit-guide/api/interview-contract.selfcheck.ts
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import axios from 'axios'
import type { CareerGuideInterviewCreateRequest } from '@/shared/api/generated/careers/schemas/careerGuideInterviewCreateRequest.ts'
import type { CareerGuideInterviewDeleteRequest } from '@/shared/api/generated/careers/schemas/careerGuideInterviewDeleteRequest.ts'
import type { CareerGuideInterviewUpdateRequest } from '@/shared/api/generated/careers/schemas/careerGuideInterviewUpdateRequest.ts'
import type { InterviewSaveItem } from '@/entities/recruit-guide/model/types.ts'
import { mapInterview } from './map-interview.ts'
import {
  isRecruitGuideVersionConflict,
  recruitGuideSaveFailureAlert,
} from '../lib/save-failure-alert.ts'

type ExactKeys<T, K extends keyof T> = Exclude<keyof T, K> extends never
  ? Exclude<K, keyof T> extends never
    ? true
    : never
  : never

const _createKeys: ExactKeys<CareerGuideInterviewCreateRequest, 'impactStoryId' | 'title' | 'year'> =
  true
const _updateKeys: ExactKeys<CareerGuideInterviewUpdateRequest, 'title' | 'year' | 'version'> = true
const _deleteKeys: ExactKeys<CareerGuideInterviewDeleteRequest, 'version'> = true
const _saveKeys: ExactKeys<InterviewSaveItem, 'impactStoryId' | 'title' | 'publishedYear'> = true
void _createKeys
void _updateKeys
void _deleteKeys
void _saveKeys

const createPayload = {
  impactStoryId: 7,
  title: '자원봉사자 인터뷰',
  year: 2026,
} satisfies CareerGuideInterviewCreateRequest

const updatePayload = {
  title: '수정된 인터뷰 제목',
  version: 1,
} satisfies CareerGuideInterviewUpdateRequest

const deletePayload = { version: 1 } satisfies CareerGuideInterviewDeleteRequest

assert.deepEqual(Object.keys(createPayload).sort(), ['impactStoryId', 'title', 'year'])
assert.deepEqual(Object.keys(updatePayload).sort(), ['title', 'version'])
assert.ok(!('storyKey' in updatePayload))
assert.ok(!('impactStoryId' in updatePayload))
assert.deepEqual(Object.keys(deletePayload), ['version'])

function axiosError(code: string, field?: string, message = 'server-fallback') {
  return new axios.AxiosError(
    'request failed',
    undefined,
    undefined,
    undefined,
    {
      status: 409,
      statusText: 'Conflict',
      headers: { 'x-trace-id': 'trace-9' },
      config: { headers: {} } as never,
      data: { code, message, field: field ?? null },
    }
  )
}

const mapped = mapInterview({
  id: 13,
  impactStoryId: 7,
  storyKey: 'impact-story-7',
  displayOrder: 1,
  title: '자원봉사자 인터뷰',
  year: null,
  coverImageUrl: 'https://example.test/cover.png',
  impactStory: {
    id: 7,
    title: 'Impact Story 제목',
    isPublished: true,
  },
  linkStatus: 'LINKED',
  version: 1,
})

assert.equal(mapped.id, '13')
assert.equal(mapped.impactStoryId, 7)
assert.equal(mapped.storyKey, 'impact-story-7')
assert.equal(mapped.displayOrder, 1)
assert.equal(mapped.publishedYear, null)
assert.equal(mapped.version, 1)
assert.equal(mapped.imageUrl, 'https://example.test/cover.png')

const highId = mapInterview({
  id: 10,
  impactStoryId: 8,
  storyKey: 'impact-story-8',
  displayOrder: 2,
  title: '두 번째',
  year: 2026,
  coverImageUrl: null,
  impactStory: { id: 8, imageUrl: 'https://example.test/story.png' },
  linkStatus: 'LINKED',
  version: 3,
})
assert.equal(highId.id, '10')
assert.equal(highId.imageUrl, 'https://example.test/story.png')

const emptyCover = mapInterview({
  id: 11,
  impactStoryId: 2,
  storyKey: 'impact-story-2',
  displayOrder: 4,
  title: '첨부 없는 스토리',
  year: null,
  coverImageUrl: null,
  impactStory: { id: 2, imageUrl: null },
  linkStatus: 'LINKED',
  version: 1,
})
assert.equal(emptyCover.displayOrder, 4)
assert.equal(emptyCover.publishedYear, null)
assert.equal(emptyCover.imageUrl, undefined)

const sorted = [highId, mapped].sort((a, b) => a.displayOrder - b.displayOrder)
assert.deepEqual(
  sorted.map(row => row.id),
  ['13', '10']
)

assert.throws(
  () =>
    mapInterview({
      id: 1,
      displayOrder: 0,
      title: 'invalid',
    }),
  /CAREER_GUIDE_INTERVIEW_RESPONSE_INVALID/
)

const errorCases: Array<[string, string]> = [
  ['CAREER_GUIDE_INTERVIEW_LIMIT_EXCEEDED', '직무 인터뷰는 최대 9개까지 등록할 수 있습니다.'],
  ['CAREER_GUIDE_INTERVIEW_DUPLICATE', 'server-fallback'],
  ['CAREER_GUIDE_INTERVIEW_IMPACT_STORY_NOT_FOUND', '선택한 임팩트 스토리를 찾을 수 없습니다.'],
  ['CAREER_GUIDE_INTERVIEW_IMPACT_STORY_NOT_PUBLIC', '공개된 임팩트 스토리만 등록할 수 있습니다.'],
  ['CAREER_GUIDE_INTERVIEW_NOT_FOUND', '직무 인터뷰를 찾을 수 없습니다.'],
  [
    'CAREER_GUIDE_INTERVIEW_VERSION_CONFLICT',
    '다른 사용자가 먼저 수정했습니다. 최신 정보를 다시 불러와 주세요.',
  ],
  ['VERSION_CONFLICT', '다른 사용자가 먼저 수정했습니다. 최신 정보를 다시 불러와 주세요.'],
  ['INVALID_CAREER_GUIDE_INTERVIEW_TITLE', '인터뷰 제목을 확인해 주세요.'],
  ['INVALID_CAREER_GUIDE_INTERVIEW_YEAR', '게시 연도를 확인해 주세요.'],
  [
    'FORBIDDEN',
    '해당 화면은 권한이 있는 사용자만 이용할 수 있습니다.\n접근이 필요하신 경우 마스터 관리자에게 문의해 주세요.',
  ],
]

for (const [code, content] of errorCases) {
  const alert = recruitGuideSaveFailureAlert(axiosError(code), 'fallback')
  assert.equal(alert.content, content, code)
}

assert.equal(
  recruitGuideSaveFailureAlert(axiosError('VALIDATION_ERROR', 'year'), 'fallback').content,
  '게시 연도를 확인해 주세요.'
)
assert.equal(
  recruitGuideSaveFailureAlert(axiosError('VALIDATION_ERROR', 'title'), 'fallback').content,
  '인터뷰 제목을 확인해 주세요.'
)
assert.equal(
  recruitGuideSaveFailureAlert(
    axiosError(
      'CAREER_GUIDE_INTERVIEW_DUPLICATE',
      'impactStoryId',
      '이미 등록된 임팩트 스토리입니다. 다른 임팩트 스토리를 선택해주세요.'
    ),
    'fallback'
  ).content,
  '이미 등록된 임팩트 스토리입니다. 다른 임팩트 스토리를 선택해주세요.'
)
assert.doesNotMatch(
  String(
    recruitGuideSaveFailureAlert(
      axiosError(
        'CAREER_GUIDE_INTERVIEW_DUPLICATE',
        'impactStoryId',
        '이미 등록된 임팩트 스토리입니다. 다른 임팩트 스토리를 선택해주세요.'
      ),
      'fallback'
    ).content
  ),
  /추적번호/
)
assert.doesNotMatch(
  String(recruitGuideSaveFailureAlert(axiosError('FORBIDDEN'), 'fallback').content),
  /추적번호/
)
assert.equal(isRecruitGuideVersionConflict(axiosError('VERSION_CONFLICT')), true)
assert.equal(isRecruitGuideVersionConflict(axiosError('CAREER_GUIDE_INTERVIEW_VERSION_CONFLICT')), true)
assert.equal(isRecruitGuideVersionConflict(axiosError('CAREER_GUIDE_INTERVIEW_DUPLICATE')), false)

const here = dirname(fileURLToPath(import.meta.url))
const serviceSrc = readFileSync(resolve(here, 'service.ts'), 'utf8')
const apiSrc = readFileSync(
  resolve(here, '../../../shared/api/generated/careers/careers-api.ts'),
  'utf8'
)
const openapiSrc = readFileSync(
  resolve(here, '../../../../openapi/careers.openapi.json'),
  'utf8'
)
const selectModalSrc = readFileSync(resolve(here, '../ui/interview-select-modal.tsx'), 'utf8')
const alertSrc = readFileSync(resolve(here, '../lib/save-failure-alert.ts'), 'utf8')
const hooksSrc = readFileSync(resolve(here, 'hooks.ts'), 'utf8')
const sectionSrc = readFileSync(resolve(here, '../ui/interview-section.tsx'), 'utf8')

assert.match(apiSrc, /url: `\/api\/admin\/careers\/guide\/interviews`, method: 'POST'/)
assert.match(
  apiSrc,
  /url: `\/api\/admin\/careers\/guide\/interviews\/\$\{id\}`, method: 'PUT'/
)
assert.match(
  apiSrc,
  /url: `\/api\/admin\/careers\/guide\/interviews\/\$\{id\}`, method: 'DELETE'/
)
assert.match(
  apiSrc,
  /url: `\/api\/admin\/careers\/guide\/interviews\/bulk-delete`, method: 'POST'/
)
assert.match(apiSrc, /data: careerGuideInterviewDeleteRequest/)
assert.match(apiSrc, /data: careerGuideInterviewCreateRequest/)
assert.match(apiSrc, /data: careerGuideInterviewUpdateRequest/)

assert.match(serviceSrc, /createCareerGuideInterview\(\{[\s\S]*impactStoryId:/)
assert.match(serviceSrc, /year: interviewYear\(input\.publishedYear\)/)
assert.match(serviceSrc, /deleteCareerGuideInterview\(numericId, \{ version: current\.version \}\)/)
assert.match(serviceSrc, /bulkDeleteCareerGuideInterviews\(\{ items \}\)/)
assert.doesNotMatch(
  serviceSrc,
  /for \(const id of ids\) \{[\s\S]*deleteCareerGuideInterview/
)
assert.match(serviceSrc, /return getRecruitGuideService\(\)/)
assert.match(serviceSrc, /current\.impactStoryId === input\.impactStoryId/)
assert.doesNotMatch(serviceSrc, /createCareerGuideInterview\([\s\S]*storyKey/)
assert.doesNotMatch(serviceSrc, /updateCareerGuideInterview\([\s\S]*storyKey/)
assert.doesNotMatch(
  serviceSrc,
  /updateCareerGuideInterview\(\s*numericId,\s*\{[^}]*impactStoryId/
)
assert.doesNotMatch(serviceSrc, /numericId > MAX_RECRUIT_INTERVIEWS/)
assert.doesNotMatch(serviceSrc, /persist:\s*false/)

assert.match(openapiSrc, /"CareerGuideInterviewCreateRequest"/)
assert.match(openapiSrc, /"CareerGuideInterviewUpdateRequest"/)
assert.match(openapiSrc, /"CareerGuideInterviewDeleteRequest"/)
assert.match(openapiSrc, /\/api\/admin\/careers\/guide\/interviews\/bulk-delete/)
assert.match(selectModalSrc, /impactStoryId,/)
assert.match(selectModalSrc, /publishedYear: null/)
assert.match(selectModalSrc, /visibility: 'public'/)
assert.match(selectModalSrc, /isHomepageVisible\(story\)/)
assert.doesNotMatch(alertSrc, /추적번호/)
assert.doesNotMatch(alertSrc, /traceId/)
assert.match(hooksSrc, /await refresh\(\)/)
assert.match(hooksSrc, /isRecruitGuideVersionConflict\(error\)/)
assert.match(hooksSrc, /useRemoveRecruitInterviews[\s\S]*onSuccess: data => \{\s*setCache\(data\)/)
assert.match(hooksSrc, /useRemoveRecruitInterviews[\s\S]*onError: async \(\) => \{\s*await refresh\(\)/)
assert.match(sectionSrc, /record\.displayOrder/)
assert.match(sectionSrc, /atLimit \? null/)
assert.match(sectionSrc, /rowKey="id"/)
assert.match(sectionSrc, /open=\{picker != null\}/)
assert.match(sectionSrc, /picker\?\.type === 'edit'/)
assert.doesNotMatch(sectionSrc, /InterviewEditModal/)

console.log('interview-contract.selfcheck ok')
