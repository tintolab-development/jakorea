/**
 * CMS Portal 프로그램 상세 매퍼
 *
 * 숫자 programId·title 없는 페이로드는 버린다.
 * 홈 카드 클릭은 CMS 숫자 id → GET /api/portal/programs/{id}.
 */
import assert from 'node:assert/strict'
import { mapPortalProgramDetail, mapPortalProgramListItem, parsePortalProgramId, portalPublicFileContentUrl } from './mappers.ts'

assert.equal(parsePortalProgramId('186012'), 186012)
assert.equal(parsePortalProgramId('trained-teacher-primary-case-08'), null)
assert.equal(parsePortalProgramId('0'), null)
assert.equal(parsePortalProgramId(''), null)

assert.equal(mapPortalProgramDetail({ title: '제목만' }), null)

const mapped = mapPortalProgramDetail({
  programId: 186012,
  programType: 'GENERAL_INDIVIDUAL',
  portalCategories: ['YOUTH_YOUNG'],
  title: '성과 공유회',
  summary: '요약',
  operationMethod: 'ONLINE',
  businessStartDate: '2026-09-01',
  businessEndDate: '2026-12-31',
  periodStatus: 'RECRUITING',
  applicationTargetMode: 'INDIVIDUAL',
  businessField: '진로교육',
  venue: '온라인',
  contactEmail: 'cc@jakorea.org',
  contactPhone: '02-6085-6028',
  additionalContentHtml: '<p>추가 안내</p>',
  educationTarget: 'university',
  thumbnailFileObjectId: 77,
  sponsorNames: ['현대 자동차'],
  recruitments: [
    {
      recruitmentType: 'PARTICIPANT',
      open: true,
      startAt: '2026-09-10T00:00:00',
      endAt: '2026-10-10T23:59:59',
    },
  ],
  curricula: [
    {
      title: '커리큘럼',
      sessions: [{ sessionNo: 1, title: '오리엔테이션', content: '소개' }],
    },
  ],
  attachments: [{ fileObjectId: 88, originalFileName: '안내.pdf' }],
})
assert.ok(mapped)
assert.equal(mapped.id, '186012')
assert.equal(mapped.category, 'youth')
assert.equal(mapped.recruitmentStatus, 'recruiting')
assert.equal(mapped.educationForm, 'online')
assert.equal(mapped.educationTargetKey, 'university')
assert.equal(mapped.educationTargetLabel, '대학(원)생')
assert.equal(mapped.sponsor, '현대 자동차')
assert.equal(mapped.detailCase, 'general')
assert.equal(mapped.educationStructure, 'curriculum')
assert.equal(mapped.sessions.length, 1)
assert.equal(mapped.eventSchedules.length, 0)
assert.equal(mapped.thumbnailUrl, portalPublicFileContentUrl(77))
assert.equal(mapped.attachments[0]?.url, '/api/portal/public/files/88/download')
assert.equal(mapped.contactValue, '02-6085-6028 · cc@jakorea.org')
assert.ok(mapped.extraSections.some(section => section.title === '추가 내용'))

const ujat = mapPortalProgramDetail({
  programId: 9,
  title: 'UJAT',
  programType: 'UJAT',
  recruitments: [{ recruitmentType: 'VOLUNTEER' }],
})
assert.ok(ujat)
assert.equal(ujat.detailCase, 'ujat-volunteer')
assert.equal(ujat.category, 'youth')

const listed = mapPortalProgramListItem({
  programId: 186012,
  title: '성과 공유회',
  programType: 'GENERAL_INDIVIDUAL',
  portalCategories: ['YOUTH_YOUNG'],
  operationMethod: 'ONLINE',
  recruitmentStatus: 'OPEN',
  periodStatus: 'SCHEDULED',
  educationTarget: 'university',
  businessStartDate: '2026-09-17',
  businessEndDate: '2026-09-18',
  recruitmentStartAt: '2026-09-16T15:00:00Z',
  recruitmentEndAt: '2026-09-17T15:00:00Z',
})
assert.ok(listed)
assert.equal(listed.id, '186012')
assert.equal(listed.recruitmentStatus, 'recruiting')
assert.equal(listed.educationTargetLabel, '대학(원)생')

const recruitingAlias = mapPortalProgramListItem({
  programId: 3,
  title: '모집 중 별칭',
  recruitmentStatus: 'RECRUITING',
  periodStatus: 'SCHEDULED',
})
assert.ok(recruitingAlias)
assert.equal(recruitingAlias.recruitmentStatus, 'recruiting')

const scheduledAlias = mapPortalProgramListItem({
  programId: 4,
  title: '모집 예정 별칭',
  recruitmentStatus: 'SCHEDULED',
})
assert.ok(scheduledAlias)
assert.equal(scheduledAlias.recruitmentStatus, 'scheduled')

const upcoming = mapPortalProgramListItem({
  programId: 2,
  title: '예정',
  recruitmentStatus: 'UPCOMING',
})
assert.ok(upcoming)
assert.equal(upcoming.recruitmentStatus, 'scheduled')

const withSelection = mapPortalProgramDetail({
  programId: 11,
  title: '선발 일정',
  applicationMethod: '홈페이지 온라인 신청',
  recruitments: [
    {
      recruitmentType: 'PARTICIPANT',
      startAt: '2026-09-01T00:00:00',
      endAt: '2026-09-10T00:00:00',
      interviewEnabled: false,
      finalPassAnnouncementAt: '2026-10-01T00:00:00+09:00',
    },
  ],
  schedules: [
    { scheduleName: '비공개', publiclyVisible: false, startAt: '2026-09-01T00:00:00' },
    {
      scheduleName: '오리엔테이션',
      scheduleKind: 'PRE_EDUCATION',
      term: 'FIRST_HALF',
      publiclyVisible: true,
      startAt: '2026-09-12T00:00:00',
    },
  ],
})
assert.ok(withSelection)
assert.equal(withSelection.applicationMethodValue, '홈페이지 온라인 신청')
assert.equal(
  withSelection.recruitmentPhases.some(phase => phase.label === '1차 서류 합격자 발표'),
  false,
)
assert.equal(
  withSelection.recruitmentPhases.some(phase => phase.label === '최종 합격자 발표'),
  true,
)
assert.equal(withSelection.eventSchedules.length, 1)
assert.equal(withSelection.eventSchedules[0]?.name, '사전교육 전반 오리엔테이션')

console.log('program portal mappers.selfcheck: ok')
