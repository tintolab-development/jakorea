/**
 * CMS Portal 프로그램 상세 매퍼
 *
 * 숫자 programId·title 없는 페이로드는 버린다.
 * 홈 카드 클릭은 CMS 숫자 id → GET /api/portal/programs/{id}.
 */
import assert from 'node:assert/strict'
import type { PortalProgramDetail } from './types.ts'
import {
  withRecruitmentMethod,
  mapPortalProgramDetail,
  mapPortalProgramEducationBadgeLabels,
  mapPortalProgramListItem,
  parsePortalProgramId,
  portalPublicFileContentUrl,
} from './mappers.ts'
import { curriculumSessionTitle } from '../lib/curriculum-session-title.ts'

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
  contactName: 'JA Korea',
  contactEmail: 'cc@jakorea.org',
  contactPhone: '02-6085-6028',
  recruitmentGuide: '모집 안내 본문',
  additionalContentHtml:
    '<p>추가 안내</p><p><span style="color: rgb(229, 57, 53);">red</span><br><span data-name="grinning" data-type="emoji">😀</span></p><img src="/api/admin/files/42/content" alt="사진" />',
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

const multi = mapPortalProgramDetail({
  programId: 186013,
  title: '복수 교육대상',
  programType: 'TRAINED_TEACHER',
  educationTarget: 'university',
  educationTargets: ['university', 'middle', 'high'],
})
assert.ok(multi)
assert.equal(multi.educationTargetLabel, '대학(원)생, 중학교, 고등학교')
assert.equal(multi.educationTargetGroupLabel, '대학(원)생, 중학교, 고등학교')

const multiPrefersArray = mapPortalProgramDetail({
  programId: 186014,
  title: '배열 우선',
  educationTarget: 'elementary',
  educationTargets: ['middle', 'high'],
})
assert.ok(multiPrefersArray)
assert.equal(multiPrefersArray.educationTargetLabel, '중학교, 고등학교')
assert.equal(multiPrefersArray.educationTargetKey, 'middle')
assert.deepEqual(multiPrefersArray.educationTargetKeys, ['middle', 'high'])

assert.equal(mapped.sponsor, '현대 자동차')

const geminiSponsorFromPortal = mapPortalProgramDetail({
  programId: 186387,
  programType: 'GEMINI_TRAINING',
  title: 'E2E테스트 1025 제미나이 찾아가는 연수',
  sponsorNames: ['Google for Education'],
  recruitments: [{ recruitmentId: 186830, recruitmentType: 'INSTRUCTOR', applicationTypes: ['INSTRUCTOR'] }],
})
assert.ok(geminiSponsorFromPortal)
assert.equal(geminiSponsorFromPortal.sponsor, 'Google for Education')

const geminiSponsorEmpty = mapPortalProgramDetail({
  programId: 186387,
  programType: 'GEMINI_TRAINING',
  title: '빈 후원사',
  sponsorNames: [],
})
assert.ok(geminiSponsorEmpty)
assert.equal(geminiSponsorEmpty.sponsor, '-')

const geminiSponsorFocusKeepsProgramField = mapPortalProgramDetail(
  {
    programId: 186387,
    programType: 'GEMINI_TRAINING',
    title: '포커스 후원사',
    sponsorNames: ['Google for Education'],
    recruitments: [
      {
        recruitmentId: 186830,
        recruitmentType: 'INSTRUCTOR',
        applicationTypes: ['INSTRUCTOR'],
        recruitmentGuide: null,
      },
    ],
  },
  { applicationTypes: ['INSTRUCTOR'], recruitmentIds: [186830] },
)
assert.ok(geminiSponsorFocusKeepsProgramField)
assert.equal(geminiSponsorFocusKeepsProgramField.sponsor, 'Google for Education')

const generalEmptySponsorStaysHidden = mapPortalProgramDetail({
  programId: 186012,
  programType: 'GENERAL_INDIVIDUAL',
  title: '후원사 없음',
  sponsorNames: [],
})
assert.ok(generalEmptySponsorStaysHidden)
assert.equal(generalEmptySponsorStaysHidden.sponsor, '-')

const geminiStoredSponsorUnchanged = mapPortalProgramDetail({
  programId: 186429,
  programType: 'GEMINI_TRAINING',
  title: '저장된 후원사',
  sponsorNames: ['JA Korea'],
})
assert.ok(geminiStoredSponsorUnchanged)
assert.equal(geminiStoredSponsorUnchanged.sponsor, 'JA Korea')
assert.equal(mapped.detailCase, 'general')
assert.equal(mapped.educationStructure, 'curriculum')
assert.equal(mapped.sessions.length, 0)
assert.equal(mapped.eventSchedules.length, 0)
assert.equal(mapped.educationScheduleMode, 'date')
assert.deepEqual(mapped.educationScheduleLines, [])
assert.equal(
  mapped.basicInfoFields.some(field => field.label === '교육 형태'),
  false
)
assert.equal(mapped.thumbnailUrl, portalPublicFileContentUrl(77))
assert.equal(mapped.attachments[0]?.url, '/api/portal/public/files/88/download')
assert.equal(mapped.contactValue, 'JA Korea, Tel : 02-6085-6028, E-mail : cc@jakorea.org')
assert.equal(mapped.participationMethod, 'individual')

const individualTeam = mapPortalProgramDetail({
  programId: 186087,
  programType: 'GENERAL_INDIVIDUAL',
  applicationTargetMode: 'INDIVIDUAL',
  participationMethod: 'team',
  title: '팀 참여 개인',
})
assert.ok(individualTeam)
assert.equal(individualTeam.participationMethod, 'team')
assert.deepEqual(
  mapped.extraSections.map(section => section.title),
  ['모집 안내', '추가 내용']
)
assert.deepEqual(
  mapped.extraSections.find(section => section.title === '추가 내용'),
  {
    title: '추가 내용',
    body: '<p>추가 안내</p><p><span style="color: rgb(229, 57, 53);">red</span><br><span data-name="grinning" data-type="emoji">😀</span></p><img src="/api/portal/public/files/42/content?inline=1" alt="사진" />',
    bodyFormat: 'html',
  }
)

const imageOnly = mapPortalProgramDetail({
  programId: 186088,
  programType: 'GENERAL_ORGANIZATION',
  title: '이미지만',
  additionalContentHtml: '<p><img src="/api/admin/files/91/content" alt="사진" /></p>',
})
assert.ok(imageOnly)
assert.deepEqual(
  imageOnly.extraSections.find(section => section.title === '추가 내용'),
  {
    title: '추가 내용',
    body: '<p><img src="/api/portal/public/files/91/content?inline=1" alt="사진" /></p>',
    bodyFormat: 'html',
  },
)

const orgFocusKeepsProgramHtmlWhenRowOmitsAdditionalContent = mapPortalProgramDetail(
  {
    programId: 1691535,
    title: '기관 프로그램',
    programType: 'GENERAL_ORGANIZATION',
    additionalContentHtml: '<p><img src="/api/admin/files/91/content" alt="사진" /></p>',
    recruitments: [
      {
        recruitmentId: 1692001,
        recruitmentType: 'PARTICIPANT',
        applicationTypes: ['ORGANIZATION'],
        announcementTitle: '기관 공고',
      },
    ],
  },
  { recruitmentIds: [1692001], applicationTypes: ['ORGANIZATION'] },
)
assert.ok(orgFocusKeepsProgramHtmlWhenRowOmitsAdditionalContent)
assert.deepEqual(
  orgFocusKeepsProgramHtmlWhenRowOmitsAdditionalContent.extraSections.find(
    section => section.title === '추가 내용',
  ),
  {
    title: '추가 내용',
    body: '<p><img src="/api/portal/public/files/91/content?inline=1" alt="사진" /></p>',
    bodyFormat: 'html',
  },
)

const orgFocusDoesNotFillNullRowAdditionalContent = mapPortalProgramDetail(
  {
    programId: 1691536,
    title: '기관 프로그램',
    programType: 'GENERAL_ORGANIZATION',
    additionalContentHtml: '<p><img src="/api/admin/files/91/content" alt="사진" /></p>',
    recruitments: [
      {
        recruitmentId: 1692002,
        recruitmentType: 'PARTICIPANT',
        applicationTypes: ['ORGANIZATION'],
        additionalContentHtml: null,
      },
    ],
  },
  { recruitmentIds: [1692002], applicationTypes: ['ORGANIZATION'] },
)
assert.ok(orgFocusDoesNotFillNullRowAdditionalContent)
assert.equal(
  orgFocusDoesNotFillNullRowAdditionalContent.extraSections.some(
    section => section.title === '추가 내용',
  ),
  false,
)

const individualOnly = mapPortalProgramDetail({
  programId: 186015,
  title: '개인 참여',
  programType: 'GENERAL_INDIVIDUAL',
  applicationTargetMode: 'INDIVIDUAL',
  participationMethod: 'individual',
})
assert.ok(individualOnly)
assert.equal(individualOnly.participationMethod, 'individual')

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
assert.equal(listed.recruitmentPeriodLabel, '2026년 9월 17일(목) ~ 2026년 9월 18일(금)')

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
  false
)
assert.equal(
  withSelection.recruitmentPhases.some(phase => phase.label === '최종 합격자 발표'),
  true
)
assert.equal(withSelection.eventSchedules.length, 1)
assert.equal(withSelection.eventSchedules[0]?.name, '봉사자 사전교육 상반기 오리엔테이션')

const ujatTermSchedules = mapPortalProgramDetail({
  programId: 182199,
  title: 'UJAT 상·하반기 교육 일정',
  programType: 'UJAT',
  schedules: [
    {
      scheduleName: '기관 교육',
      scheduleKind: 'EDUCATION',
      term: 'FIRST_HALF',
      startAt: '2026-04-10T01:00:00Z',
      endAt: '2026-04-10T03:00:00Z',
    },
    {
      scheduleName: '기관 교육',
      scheduleKind: 'EDUCATION',
      term: 'SECOND_HALF',
      startAt: '2026-09-10T01:00:00Z',
      endAt: '2026-09-10T03:00:00Z',
    },
    {
      scheduleName: '봉사자 사전교육',
      scheduleKind: 'PRE_EDUCATION',
      startAt: '2026-03-20T01:00:00Z',
      endAt: '2026-03-20T02:00:00Z',
    },
    {
      scheduleName: '봉사자 교육',
      scheduleKind: 'EDUCATION',
      startAt: '2026-04-20T01:00:00Z',
      endAt: '2026-04-20T02:00:00Z',
    },
    {
      scheduleName: '해단식',
      scheduleKind: 'CLOSING',
      startAt: '2026-12-20T01:00:00Z',
      endAt: '2026-12-20T02:00:00Z',
    },
  ],
})
assert.ok(ujatTermSchedules)
assert.deepEqual(
  ujatTermSchedules.eventSchedules.map(schedule => `${schedule.scheduleLabel} ${schedule.name}`.trim()),
  [
    '상반기(1학기) 교육 진행',
    '하반기(2학기) 교육 진행',
    '봉사자 사전교육',
    '교육 진행',
    '해단식',
  ],
)
assert.equal(ujatTermSchedules.educationSchedules.length, 0)
assert.deepEqual(
  ujatTermSchedules.ujatEducationHalfRanges,
  [
    {
      half: 'h1',
      startAt: '2026-04-10T01:00:00Z',
      endAt: '2026-04-10T03:00:00Z',
    },
    {
      half: 'h2',
      startAt: '2026-09-10T01:00:00Z',
      endAt: '2026-09-10T03:00:00Z',
    },
  ],
)

// UJAT can carry the generic education-progress projection while its public
// half/pre-education/closing rows still arrive through schedules[]. The latter
// must remain visible instead of being discarded by the projection branch.
const ujatProjectedWithRuntimeSchedules = mapPortalProgramDetail({
  programId: 182200,
  title: 'UJAT 투영 정보와 공개 일정',
  programType: 'UJAT',
  recruitments: [{ recruitmentType: 'PARTICIPANT', applicationTypes: ['ORGANIZATION'] }],
  educationStructure: 'curriculum',
  sessionRound: 'multi',
  educationScheduleLines: [],
  scheduleDetails: [],
  schedules: [
    {
      scheduleName: '기관 교육',
      scheduleKind: 'EDUCATION',
      term: 'FIRST_HALF',
      startAt: '2026-04-10T01:00:00Z',
      endAt: '2026-04-10T03:00:00Z',
    },
    {
      scheduleName: '봉사자 사전교육',
      scheduleKind: 'PRE_EDUCATION',
      startAt: '2026-03-20T01:00:00Z',
      endAt: '2026-03-20T02:00:00Z',
    },
    {
      scheduleName: '해단식',
      scheduleKind: 'CLOSING',
      startAt: '2026-12-20T01:00:00Z',
      endAt: '2026-12-20T02:00:00Z',
    },
  ],
})
assert.ok(ujatProjectedWithRuntimeSchedules)
assert.deepEqual(
  ujatProjectedWithRuntimeSchedules.eventSchedules.map(schedule =>
    `${schedule.scheduleLabel} ${schedule.name}`.trim(),
  ),
  ['상반기(1학기) 교육 진행', '봉사자 사전교육', '해단식'],
)
assert.equal(ujatProjectedWithRuntimeSchedules.educationSchedules.length, 0)

const ujatVolunteerProjectedWithRuntimeSchedules = mapPortalProgramDetail({
  programId: 182201,
  title: 'UJAT 봉사자 투영 정보와 공개 일정',
  programType: 'UJAT',
  recruitments: [{ recruitmentType: 'VOLUNTEER', applicationTypes: ['VOLUNTEER'] }],
  educationStructure: 'curriculum',
  educationScheduleLines: [],
  schedules: [
    {
      scheduleName: '봉사자 교육 진행',
      scheduleKind: 'EDUCATION',
      term: 'SECOND_HALF',
      startAt: '2026-09-10T01:00:00Z',
      endAt: '2026-09-10T03:00:00Z',
    },
  ],
})
assert.ok(ujatVolunteerProjectedWithRuntimeSchedules)
assert.equal(ujatVolunteerProjectedWithRuntimeSchedules.detailCase, 'ujat-volunteer')
assert.equal(ujatVolunteerProjectedWithRuntimeSchedules.eventSchedules[0]?.scheduleLabel, '하반기(2학기)')
assert.equal(ujatVolunteerProjectedWithRuntimeSchedules.eventSchedules[0]?.name, '교육 진행')
assert.equal(ujatVolunteerProjectedWithRuntimeSchedules.educationSchedules.length, 0)

const ujatUndatedPublicSchedules = mapPortalProgramDetail({
  programId: 182202,
  title: 'UJAT 일정 미정',
  programType: 'UJAT',
  recruitments: [{ recruitmentType: 'PARTICIPANT', applicationTypes: ['ORGANIZATION'] }],
  schedules: [
    { scheduleKind: 'SESSION', term: 'FIRST_HALF', publiclyVisible: true },
    { scheduleKind: 'PRE_EDUCATION', term: 'FIRST_HALF', publiclyVisible: false },
  ],
})
assert.ok(ujatUndatedPublicSchedules)
assert.equal(ujatUndatedPublicSchedules.eventSchedules.length, 1)
assert.equal(ujatUndatedPublicSchedules.eventSchedules[0]?.scheduleLabel, '상반기(1학기)')
assert.equal(ujatUndatedPublicSchedules.eventSchedules[0]?.name, '기관')
assert.equal(ujatUndatedPublicSchedules.eventSchedules[0]?.dateLabel, '일정 미정')
assert.equal(ujatUndatedPublicSchedules.educationSchedules.length, 0)

const ujat186383 = mapPortalProgramDetail({
  programId: 186383,
  title: 'UJAT 기관 상반기',
  programType: 'UJAT',
  recruitments: [{ recruitmentType: 'PARTICIPANT', applicationTypes: ['ORGANIZATION'] }],
  schedules: [
    { scheduleKind: 'SESSION', term: 'FIRST_HALF' },
    {
      scheduleKind: 'PRE_EDUCATION',
      term: 'FIRST_HALF',
      publiclyVisible: false,
      startAt: '2026-03-01T00:00:00Z',
    },
  ],
})
assert.ok(ujat186383)
assert.deepEqual(ujat186383.eventSchedules, [
  {
    scheduleLabel: '상반기(1학기)',
    name: '기관',
    dateLabel: '일정 미정',
  },
])
assert.deepEqual(ujat186383.educationSchedules, [])

const ujat186385 = mapPortalProgramDetail({
  programId: 186385,
  title: 'UJAT 기관 하반기',
  programType: 'UJAT',
  recruitments: [{ recruitmentType: 'PARTICIPANT', applicationTypes: ['ORGANIZATION'] }],
  schedules: [
    {
      scheduleKind: 'SESSION',
      term: 'SECOND_HALF',
      startAt: '2026-09-01T00:00:00Z',
      endAt: '2026-09-01T03:00:00Z',
    },
  ],
})
assert.ok(ujat186385)
assert.equal(ujat186385.eventSchedules[0]?.scheduleLabel, '하반기(2학기)')
assert.equal(ujat186385.eventSchedules[0]?.name, '기관')
assert.equal(ujat186385.educationSchedules.length, 0)

const general186389 = mapPortalProgramDetail({
  programId: 186389,
  title: '일반 기관 프로그램',
  programType: 'GENERAL_ORGANIZATION',
  schedules: [
    { scheduleKind: 'SESSION', startAt: '2026-04-01T00:00:00Z' },
    { scheduleKind: 'SESSION', startAt: '2026-05-01T00:00:00Z' },
  ],
})
assert.ok(general186389)
assert.equal(general186389.eventSchedules.length, 2)
assert.deepEqual(general186389.eventSchedules.map(schedule => schedule.name), ['기관', '기관'])

const generalCurriculum = mapPortalProgramDetail({
  programId: 186021,
  programType: 'GENERAL_INDIVIDUAL',
  title: '필요와 욕구',
  operationMethod: 'OFFLINE',
  educationForm: 'online',
  remarks: '일정은 학교 사정에 따라 조율할 수 있습니다.',
  otherMatters: '기타 안내',
  educationStructure: 'curriculum',
  sessionRound: 'single',
  educationFormScheduleDetail: 'common',
  participationScheduleDetail: 'common',
  ipsScheduleDetail: 'perSchedule',
  educationFormLabel: '온라인',
  participationMethod: 'individual',
  ipsTypeSummary: null,
  curricula: [
    {
      sessions: [{ sessionNo: 9, title: '운영 커리큘럼', content: '섞이면 안 됨' }],
    },
  ],
  schedules: [
    {
      scheduleName: '운영 회차',
      publiclyVisible: true,
      startAt: '2026-10-04T00:00:00+09:00',
      endAt: '2026-10-04T00:00:00+09:00',
    },
  ],
  curriculumSessions: [
    {
      sessionLabel: '1차시',
      title: '필요와 욕구, 현명한 소비',
      description: '필요한 것과 갖고 싶은 것을 구분하고 소비 계획을 세워 봅니다.',
      assignmentEnabled: false,
      educationFormLabel: '온라인',
      ipsTypeSummary: 'Succeed | Conference (컨퍼런스)',
      assignmentPeriod: '26년 10월 14일(수) 10:00 ~ 12:00',
    },
    { sessionLabel: '2차시', title: '', description: '' },
  ],
  scheduleDetails: [],
  educationScheduleMode: 'date',
  educationScheduleLines: ['26년 10월 13일(화) 10:00 ~ 12:00', '26년 10월 20일(화) 13:30 ~ 16:00'],
  educationScheduleRange: null,
})
assert.ok(generalCurriculum)
assert.equal(generalCurriculum.sessions.length, 2)
assert.equal(generalCurriculum.sessions[0]?.title, '필요와 욕구, 현명한 소비')
assert.equal(generalCurriculum.sessions[0]?.educationFormLabel, undefined)
assert.equal(generalCurriculum.sessions[0]?.assignmentPeriod, undefined)
assert.equal(generalCurriculum.sessions[1]?.title, '')
assert.equal(generalCurriculum.eventSchedules.length, 0)
assert.deepEqual(generalCurriculum.educationScheduleLines, [
  '2026년 10월 13일(화) 10:00 ~ 12:00 | 2차시',
  '2026년 10월 20일(화) 13:30 ~ 16:00 | 2차시',
])
assert.deepEqual(
  generalCurriculum.educationSchedules.map(item => item.value),
  generalCurriculum.educationScheduleLines
)
assert.deepEqual(
  generalCurriculum.educationSchedules.map(item => item.label),
  ['교육 일정 1', '교육 일정 2']
)

const periodEducationSchedule = mapPortalProgramDetail({
  programId: 186099,
  programType: 'GENERAL_INDIVIDUAL',
  title: '기간 일정',
  educationStructure: 'curriculum',
  educationScheduleMode: 'period',
  educationScheduleLines: ['표시용 문구가 기간을 덮으면 안 됨'],
  educationScheduleRange: { start: '2026-11-01', end: '2026-11-30' },
  curriculumSessions: [],
  scheduleDetails: [],
})
assert.ok(periodEducationSchedule)
assert.equal(periodEducationSchedule.educationSchedules.length, 1)
assert.equal(periodEducationSchedule.educationSchedules[0]?.label, '교육 일정')
assert.equal(
  periodEducationSchedule.educationSchedules[0]?.value,
  '2026년 11월 1일(일) ~ 2026년 11월 30일(월)'
)
assert.deepEqual(periodEducationSchedule.educationScheduleRange, {
  start: '2026-11-01',
  end: '2026-11-30',
})
const periodWithoutRange = mapPortalProgramDetail({
  programId: 186100,
  programType: 'TRAINED_TEACHER',
  title: '기간 범위 없음',
  educationStructure: 'curriculum',
  educationScheduleMode: 'period',
  educationScheduleLines: ['26년 11월 19일(목) ~ 26년 11월 30일(월)'],
})
assert.ok(periodWithoutRange)
assert.equal(periodWithoutRange.educationSchedules.length, 0)
assert.equal(periodWithoutRange.educationScheduleRange, null)
assert.equal(generalCurriculum.educationForm, 'online')
assert.equal(generalCurriculum.educationFormLabel, '온라인')
assert.equal(generalCurriculum.participationMethod, 'individual')
assert.equal(
  generalCurriculum.basicInfoFields.find(field => field.label === '교육 형태')?.value,
  '온라인'
)
assert.equal(
  generalCurriculum.basicInfoFields.some(field => field.label === '참여 방식'),
  false
)
assert.equal(
  generalCurriculum.basicInfoFields.some(field => field.label === 'IPS 유형'),
  false
)
assert.equal(
  generalCurriculum.extraSections.find(section => section.title === '비고')?.body,
  '일정은 학교 사정에 따라 조율할 수 있습니다.'
)
assert.equal(
  generalCurriculum.extraSections.some(section => section.title === '기타사항'),
  false
)

const scheduleMulti = mapPortalProgramDetail({
  programId: 186017,
  programType: 'GENERAL_INDIVIDUAL',
  title: '일정형',
  operationMethod: 'OFFLINE',
  educationForm: 'online',
  educationFormScheduleDetail: 'perSchedule',
  educationFormLabel: null,
  educationStructure: 'schedule',
  sessionRound: 'multi',
  educationScheduleLines: ['26년 9월 29일(화) 10:00 ~ 12:00'],
  scheduleDetails: [
    {
      scheduleLabel: '세부 일정 01',
      blockKind: 'preEducation',
      name: '오리엔테이션',
      scheduleDateLabel: '26년 9월 29일(화)',
      educationFormLabel: '온라인',
    },
    {
      scheduleLabel: '세부 일정 02',
      blockKind: 'sub',
      name: '본 교육',
      scheduleDateLabel: '26년 10월 6일(화)',
      progressTimeSummary: '13:00 ~ 15:00',
      educationFormLabel: '오프라인',
    },
  ],
})
assert.ok(scheduleMulti)
assert.equal(scheduleMulti.sessions.length, 0)
assert.equal(scheduleMulti.educationForm, 'online')
assert.equal(scheduleMulti.educationFormLabel, '온/오프라인')
assert.equal(
  scheduleMulti.basicInfoFields.find(field => field.label === '교육 형태')?.value,
  '온/오프라인'
)
assert.equal(scheduleMulti.eventSchedules[0]?.blockKind, 'preEducation')
// 사전 교육 행 — 세부/행사 일정 번호 대신 「사전교육」, 입력한 일정명은 그대로 붙인다.
assert.equal(scheduleMulti.eventSchedules[0]?.scheduleLabel, '사전교육')
assert.equal(scheduleMulti.eventSchedules[0]?.name, '오리엔테이션')
assert.equal(scheduleMulti.eventSchedules[1]?.scheduleLabel, '행사 일정 02')
assert.equal(scheduleMulti.eventSchedules[0]?.educationFormLabel, '온라인')
assert.equal(scheduleMulti.eventSchedules[0]?.dateLabel, '2026년 9월 29일(화)')
assert.equal(scheduleMulti.eventSchedules[1]?.educationFormLabel, '오프라인')
assert.equal(scheduleMulti.eventSchedules[1]?.dateLabel, '2026년 10월 6일(화) 13:00 ~ 15:00')
assert.equal(scheduleMulti.educationSchedules.length, 0)
assert.deepEqual(scheduleMulti.educationScheduleLines, ['2026년 9월 29일(화) 10:00 ~ 12:00'])

const scheduleSingleWithGroups = mapPortalProgramDetail({
  programId: 186019,
  programType: 'GENERAL_INDIVIDUAL',
  title: '일정형 단일 회차',
  educationStructure: 'schedule',
  sessionRound: 'single',
  scheduleDetails: [
    {
      scheduleLabel: '세부 일정 01',
      name: '오리엔테이션',
      scheduleDateLabel: '26년 9월 29일(화)',
      groupTimes: [
        { startTime: '09:30', endTime: '09:40' },
        { startTime: '13:00', endTime: '13:10' },
      ],
    },
  ],
})
assert.ok(scheduleSingleWithGroups)
assert.equal(scheduleSingleWithGroups.eventSchedules[0]?.scheduleLabel, '세부 일정 01')
assert.equal(
  scheduleSingleWithGroups.eventSchedules[0]?.dateLabel,
  '2026년 9월 29일(화) 그룹 A : 09:30 ~ 09:40 | 그룹 B : 13:00 ~ 13:10'
)

const trainedTeacherSchedule = mapPortalProgramDetail({
  programId: 186264,
  programType: 'TRAINED_TEACHER',
  title: '교육받은 교사 일정형',
  educationStructure: 'schedule',
  sessionRound: 'multi',
  educationFormScheduleDetail: 'common',
  ipsScheduleDetail: 'common',
  ipsTypeSummary: '일정 공통 | Prepare | 해당없음',
  scheduleDetails: [
    {
      scheduleLabel: '세부 일정 01',
      blockKind: 'sub',
      name: '필요와 욕구, 현명한 소비',
      scheduleDateLabel: '26년 11월 2일(월) 10:00 ~ 12:00',
      progressTimeSummary: '13:30 ~ 15:30',
      ipsTypeSummary: '일정 공통 | Prepare | 해당없음',
    },
    {
      scheduleLabel: '세부 일정 02',
      blockKind: 'sub',
      name: '저축 목표 세우기',
      scheduleDateLabel: '26년 11월 9일(월) 13:30 ~ 16:00',
      progressTimeSummary: '09:30 ~ 11:30',
      ipsTypeSummary: '일정 공통 | Prepare | 해당없음',
    },
  ],
})
assert.ok(trainedTeacherSchedule)
assert.equal(
  trainedTeacherSchedule.eventSchedules[0]?.dateLabel,
  '2026년 11월 2일(월) 10:00 ~ 12:00'
)
assert.equal(
  trainedTeacherSchedule.eventSchedules[1]?.dateLabel,
  '2026년 11월 9일(월) 13:30 ~ 16:00'
)
assert.equal('ipsTypeSummary' in trainedTeacherSchedule.eventSchedules[0]!, false)

const organization = mapPortalProgramDetail({
  programId: 186011,
  programType: 'GENERAL_ORGANIZATION',
  title: '기관',
  educationStructure: 'curriculum',
  sessionRound: 'multi',
  participationScheduleDetail: null,
  participationMethod: null,
  curriculumSessions: [{ sessionLabel: '사전 교육', title: '사전', description: '' }],
})
assert.ok(organization)
assert.equal(organization.participationMethod, 'individual')
assert.equal(
  organization.basicInfoFields.some(field => field.label === '참여 방식'),
  false
)
assert.equal(organization.sessions[0]?.sessionLabel, '사전교육')

const uppercaseMultiRound = mapPortalProgramDetail({
  programId: 186012,
  programType: 'GENERAL_ORGANIZATION',
  title: '대문자 복수 회차',
  educationStructure: 'schedule',
  sessionRound: 'MULTI',
  scheduleDetails: [
    {
      scheduleLabel: '세부 일정 01',
      scheduleDateLabel: '2026.10.01',
      progressTimeSummary: '10:00 ~ 12:00',
    },
  ],
  educationScheduleLines: ['노출되면 안 되는 일정'],
} as unknown as PortalProgramDetail)
assert.ok(uppercaseMultiRound)
assert.equal(uppercaseMultiRound.sessionRound, 'multi')
assert.equal(uppercaseMultiRound.educationSchedules.length, 0)

const trainedTeacherProgress = mapPortalProgramDetail({
  programId: 186018,
  programType: 'TRAINED_TEACHER',
  title: '수정3',
  operationMethod: 'OFFLINE',
  educationForm: 'online',
  educationTarget: 'high',
  educationTargets: ['high', 'adult'],
  educationTargetDetail: '고등학교 1~2학년, 성인 일반',
  learningSupportContent: '교재와 활동지를 제공합니다.',
  otherMatters: '우천·학교 행사와 겹치면 일정을 조정할 수 있습니다.',
  remarks: '신청 전 학교 담당 교사 확인이 필요합니다.',
  educationStructure: 'curriculum',
  sessionRound: 'single',
  educationFormScheduleDetail: 'common',
  participationScheduleDetail: 'perSchedule',
  ipsScheduleDetail: 'perSchedule',
  educationFormLabel: '온라인',
  participationMethod: null,
  ipsTypeSummary: null,
  curricula: [
    {
      sessions: [{ sessionNo: 1, title: '운영 커리큘럼', content: '섞이면 안 됨' }],
    },
  ],
  curriculumSessions: [
    {
      sessionLabel: '1차시',
      title: '수정3',
      description: '수정3',
      assignmentEnabled: false,
      assignmentPeriod: '2026년 10월 14일(수) ~ 2026년 10월 20일(화)',
      educationFormLabel: '온라인',
      ipsTypeSummary: 'Succeed | Workshop (워크숍)',
    },
  ],
  scheduleDetails: [],
  educationScheduleMode: 'date',
  educationScheduleLines: ['26년 10월 13일(화) 10:00 ~ 12:00', '26년 10월 20일(화) 13:30 ~ 16:00'],
  venue: '서울시 강서구 가양 데시앙플렉스',
  venueKind: 'inside',
})
assert.ok(trainedTeacherProgress)
// QA-0516: 교육 형태가 온라인이면 기관 안/밖 주소 대신 온라인 안내만 보인다.
assert.equal(trainedTeacherProgress.educationVenueLabel, '온라인')
{
  // 장소 구분 표기(`기관 안 | 상세`)는 오프라인 교육에서 그대로 유지한다.
  const offlineVenueFormat = mapPortalProgramDetail({
    programId: 186019,
    programType: 'TRAINED_TEACHER',
    title: '오프라인 장소 표기',
    educationForm: 'offline',
    venue: '서울시 강서구 가양 데시앙플렉스',
    venueKind: 'inside',
  })
  assert.ok(offlineVenueFormat)
  assert.equal(
    offlineVenueFormat.educationVenueLabel,
    '기관 안 | 서울시 강서구 가양 데시앙플렉스'
  )
}
assert.equal(trainedTeacherProgress.detailCase, 'general')
assert.equal(trainedTeacherProgress.educationStructure, 'curriculum')
assert.equal(trainedTeacherProgress.sessions.length, 1)
assert.equal(trainedTeacherProgress.sessions[0]?.title, '수정3')
assert.equal(trainedTeacherProgress.sessions[0]?.educationFormLabel, undefined)
assert.equal(
  trainedTeacherProgress.sessions[0]?.assignmentPeriod,
  '2026년 10월 14일(수) ~ 2026년 10월 20일(화)'
)
assert.equal(trainedTeacherProgress.educationForm, 'online')
assert.equal(trainedTeacherProgress.educationFormLabel, '온라인')
assert.equal(
  trainedTeacherProgress.basicInfoFields.find(field => field.label === '교육 형태')?.value,
  '온라인'
)

const participantChoice = mapPortalProgramDetail({
  programId: 186022,
  programType: 'GENERAL_INDIVIDUAL',
  title: '참여자 선택',
  operationMethod: 'OFFLINE',
  educationForm: 'participant_choice',
  educationFormLabel: '참여자 선택',
  educationFormScheduleDetail: 'common',
})
assert.ok(participantChoice)
assert.equal(participantChoice.educationForm, 'participant_choice')
assert.equal(participantChoice.educationFormLabel, '참여자 선택')
assert.equal(
  participantChoice.basicInfoFields.find(field => field.label === '교육 형태')?.value,
  '참여자 선택'
)

// CMS 저장값 participant_selection 이 오프라인으로 떨어지지 않아야 한다.
// 선언 타입 밖의 실제 응답값이라 캐스팅한다.
const participantSelectionCodes = ['participant_selection', 'PARTICIPANT_SELECTION'] as unknown as 'participant_choice'[]
for (const code of participantSelectionCodes) {
  const participantSelection = mapPortalProgramDetail({
    programId: 186022,
    programType: 'GENERAL_INDIVIDUAL',
    title: '참여자 선택',
    operationMethod: 'OFFLINE',
    educationForm: code,
    educationFormScheduleDetail: 'common',
  })
  assert.ok(participantSelection)
  assert.equal(participantSelection.educationForm, 'participant_choice')
}

const operationMethodFallback = mapPortalProgramDetail({
  programId: 186023,
  title: '컬럼만',
  operationMethod: 'ONLINE',
})
assert.ok(operationMethodFallback)
assert.equal(operationMethodFallback.educationForm, 'online')
assert.equal(operationMethodFallback.educationFormLabel, '온라인')
assert.equal(
  trainedTeacherProgress.basicInfoFields.some(field => field.label === '참여 방식'),
  false
)
assert.equal(
  trainedTeacherProgress.basicInfoFields.find(field => field.label === '교육 대상 상세')?.value,
  '고등학교 1~2학년, 성인 일반'
)
// 총 차시 1 → 일시만 (①)
assert.deepEqual(trainedTeacherProgress.educationScheduleLines, [
  '2026년 10월 13일(화) 10:00 ~ 12:00',
  '2026년 10월 20일(화) 13:30 ~ 16:00',
])
assert.equal(
  trainedTeacherProgress.extraSections.find(section => section.title === '학습 지원 내용')?.body,
  '교재와 활동지를 제공합니다.'
)
assert.equal(
  trainedTeacherProgress.extraSections.some(section => section.title === '기타사항'),
  false
)

const codedTargetDetail = mapPortalProgramDetail({
  programId: 186019,
  programType: 'COMPANY_SCHOOL',
  title: '코드 상세',
  educationTarget: 'high',
  educationTargetDetail: 'high',
  recruitmentTargetDetail: '고등학교 1~2학년, 성인 일반',
  educationStructure: 'curriculum',
  curriculumSessions: [{ sessionLabel: '1차시', title: '차시', description: '' }],
})
assert.ok(codedTargetDetail)
assert.equal(codedTargetDetail.educationTargetDetailLabel, '고등학교 1~2학년, 성인 일반')
assert.equal(codedTargetDetail.sessions[0]?.title, '차시')

const trainedTeacher = mapPortalProgramDetail({
  programId: 42,
  programType: 'TRAINED_TEACHER',
  title: '교육받은 교사',
  educationStructure: null,
  curriculumSessions: [],
  scheduleDetails: [],
  educationScheduleLines: [],
  curricula: [
    {
      sessions: [{ sessionNo: 1, title: '오리엔테이션', content: '소개' }],
    },
  ],
})
assert.ok(trainedTeacher)
assert.equal(trainedTeacher.sessions.length, 1)
assert.equal(trainedTeacher.sessions[0]?.title, '오리엔테이션')
// 레거시 curricula.sessions[].sessionNo는 커리큘럼 차시 — 「N회차」로 표시하지 않는다
assert.equal(trainedTeacher.sessions[0]?.sessionLabel, '1차시')
assert.equal(
  mapPortalProgramDetail({
    programId: 7,
    title: '장소만',
    venue: '상세내용',
  })?.educationVenueLabel,
  '상세내용'
)
assert.equal(
  mapPortalProgramDetail({
    programId: 8,
    title: '기관 밖',
    venueKind: 'outside',
    venue: '인근 구립도서관 강의실',
  })?.educationVenueLabel,
  '기관 밖 | 인근 구립도서관 강의실'
)
assert.equal(
  mapPortalProgramDetail({
    programId: 9,
    title: '기타 장소',
    venueKind: 'other',
    venue: 'JA Korea 교육장',
  })?.educationVenueLabel,
  'JA Korea 교육장'
)
assert.equal(
  mapPortalProgramDetail({
    programId: 10,
    title: '기존 쉼표 장소',
    venueKind: 'inside',
    venue: '기관 안, 본관 2층 교육장',
  })?.educationVenueLabel,
  '기관 안 | 본관 2층 교육장'
)
assert.equal(trainedTeacher.educationScheduleMode, 'period')

const participantCatalog = mapPortalProgramDetail({
  programId: 186030,
  title: '참여자만',
  summary: '프로그램 설명 컬럼',
  description: '모집 상세에 적은 프로그램 설명',
  periodStatus: 'SCHEDULED',
  recruitmentStatus: 'OPEN',
  businessStartDate: '2026-11-03',
  businessEndDate: '2026-12-17',
  learningSupportContent: '교재와 활동지를 제공합니다.',
  otherMatters: null,
  recruitments: [
    {
      recruitmentType: 'PARTICIPANT',
      operationStartDate: '2026-11-12',
      operationEndDate: '2026-12-17',
      interviewEnabled: false,
      documentPassAnnouncementAt: '2026-11-10T00:00:00Z',
      interviewStartAt: '2026-11-11T00:00:00Z',
      interviewEndAt: '2026-11-12T00:00:00Z',
      finalPassAnnouncementAt: '2026-11-13T15:00:00Z',
    },
  ],
})
assert.ok(participantCatalog)
assert.equal(participantCatalog.recruitmentStatus, 'recruiting')
assert.equal(participantCatalog.summary, '모집 상세에 적은 프로그램 설명')
assert.equal(participantCatalog.operatingPeriodStart, '2026-11-12')
assert.equal(participantCatalog.operatingPeriodEnd, '2026-12-17')
assert.equal(
  participantCatalog.extraSections.some(section => section.title === '기타사항'),
  false
)
assert.equal(
  participantCatalog.extraSections.find(section => section.title === '학습 지원 내용')?.body,
  '교재와 활동지를 제공합니다.'
)
assert.equal(
  participantCatalog.recruitmentPhases.some(phase => phase.label === '1차 서류 합격자 발표'),
  false
)
assert.equal(
  participantCatalog.recruitmentPhases.some(phase => phase.label === '2차 면접 기간'),
  false
)
assert.equal(
  participantCatalog.recruitmentPhases.some(phase => phase.label === '최종 합격자 발표'),
  true
)

const instructorOnly = mapPortalProgramDetail({
  programId: 186031,
  title: '강사만',
  recruitmentStatus: 'OPEN',
  learningSupportContent: null,
  otherMatters: '강사 안내',
  recruitments: [{ recruitmentType: 'INSTRUCTOR' }],
})
assert.ok(instructorOnly)
assert.equal(
  instructorOnly.extraSections.some(section => section.title === '학습 지원 내용'),
  false
)
assert.equal(
  instructorOnly.extraSections.find(section => section.title === '기타사항')?.body,
  '강사 안내'
)

// 비고 = remarks, 기타사항 = otherMatters. Gemini도 otherMatters를 비고로 대신 쓰지 않는다.
const geminiRemarksOnly = mapPortalProgramDetail({
  programId: 186033,
  programType: 'GEMINI_TRAINING',
  title: 'Gemini 비고',
  recruitmentStatus: 'OPEN',
  remarks: 'Gemini 비고',
  otherMatters: 'Gemini 기타',
})
assert.ok(geminiRemarksOnly)
assert.equal(
  geminiRemarksOnly.extraSections.find(section => section.title === '비고')?.body,
  'Gemini 비고'
)
assert.equal(
  geminiRemarksOnly.extraSections.find(section => section.title === '기타사항')?.body,
  'Gemini 기타'
)
const geminiOtherMattersOnly = mapPortalProgramDetail({
  programId: 186034,
  programType: 'GEMINI_TRAINING',
  title: 'Gemini 기타만',
  recruitmentStatus: 'OPEN',
  otherMatters: 'Gemini 기타',
})
assert.ok(geminiOtherMattersOnly)
assert.equal(
  geminiOtherMattersOnly.extraSections.some(section => section.title === '비고'),
  false
)

const noRecruitmentBadge = mapPortalProgramDetail({
  programId: 186032,
  title: '모집 없음',
  periodStatus: 'SCHEDULED',
  recruitmentStatus: 'NONE',
})
assert.ok(noRecruitmentBadge)
assert.equal(noRecruitmentBadge.recruitmentStatus, 'closed')

const businessPeriodFallback = mapPortalProgramDetail({
  programId: 186033,
  title: '운영 기간 없음',
  businessStartDate: '2026-11-03',
  businessEndDate: '2026-12-17',
  recruitments: [{ recruitmentType: 'PARTICIPANT' }],
})
assert.ok(businessPeriodFallback)
assert.equal(businessPeriodFallback.operatingPeriodStart, '2026-11-03')
assert.equal(businessPeriodFallback.operatingPeriodEnd, '2026-12-17')

const listedEducationForm = mapPortalProgramListItem({
  programId: 186034,
  title: '목록 교육 형태',
  operationMethod: 'OFFLINE',
  educationForm: 'online',
  recruitmentStatus: 'OPEN',
  periodStatus: 'SCHEDULED',
  businessStartDate: '2026-11-03',
  businessEndDate: '2026-12-17',
  operationStartDate: '2026-11-12',
  operationEndDate: '2026-12-17',
})
assert.ok(listedEducationForm)
assert.equal(listedEducationForm.educationForm, 'online')
assert.equal(listedEducationForm.educationFormLabel, '온라인')
assert.equal(listedEducationForm.recruitmentStatus, 'recruiting')
assert.equal(listedEducationForm.operatingPeriodStart, '2026-11-12')
assert.equal(listedEducationForm.operatingPeriodEnd, '2026-12-17')

/** Portal SSOT: GEMINI_TRAINING → detailCase gemini · category institution */
const geminiTraining = mapPortalProgramDetail({
  programId: 185003,
  programType: 'GEMINI_TRAINING',
  portalCategories: ['ORGANIZATION'],
  title: '제미나이 아카데미 찾아가는 연수 모집',
  recruitmentStatus: 'OPEN',
  trainingRequestStartDate: '2026-09-01',
  trainingRequestEndDate: '2026-09-30',
  recruitments: [
    {
      recruitmentType: 'ORGANIZATION',
      startAt: '2026-08-01',
      endAt: '2026-08-31',
    },
  ],
})
assert.ok(geminiTraining)
assert.equal(geminiTraining.detailCase, 'gemini')
assert.equal(geminiTraining.category, 'institution')
assert.deepEqual(geminiTraining.categories, ['institution'])

const geminiHeaderHidesInstructorWithInstitution = mapPortalProgramDetail({
  programId: 185011,
  programType: 'GEMINI_TRAINING',
  portalCategories: ['ORGANIZATION', 'INSTRUCTOR'],
  title: '제미나이 이미지',
})
assert.ok(geminiHeaderHidesInstructorWithInstitution)
assert.deepEqual(geminiHeaderHidesInstructorWithInstitution.categories, ['institution'])
assert.equal(geminiHeaderHidesInstructorWithInstitution.categoryLabel, '기관')
assert.equal(
  geminiTraining.recruitmentPhases[0]?.value,
  '2026년 8월 1일(토) ~ 2026년 8월 31일(월)',
)
assert.equal(
  geminiTraining.geminiTrainingRequestPeriodLabel,
  '2026년 9월 1일(화) ~ 2026년 9월 30일(수)',
)
assert.equal(geminiTraining.geminiTrainingRequestStartDate, '2026-09-01')
assert.equal(geminiTraining.geminiTrainingRequestEndDate, '2026-09-30')
assert.equal(geminiTraining.recruitmentPhases[0]?.label, '참여 기관 모집 기간')

const geminiWithoutTrainingRequestPeriod = mapPortalProgramDetail({
  programId: 185004,
  programType: 'GEMINI_TRAINING',
  portalCategories: ['ORGANIZATION'],
  title: '기간 미설정 Gemini',
  recruitmentStatus: 'OPEN',
})
assert.ok(geminiWithoutTrainingRequestPeriod)
assert.equal(geminiWithoutTrainingRequestPeriod.geminiTrainingRequestPeriodLabel, undefined)
assert.equal(geminiWithoutTrainingRequestPeriod.geminiTrainingRequestStartDate, undefined)
assert.equal(geminiWithoutTrainingRequestPeriod.geminiTrainingRequestEndDate, undefined)

const generalWithGeminiFields = mapPortalProgramDetail({
  programId: 185005,
  programType: 'GENERAL',
  portalCategories: ['ORGANIZATION'],
  title: '일반 프로그램',
  trainingRequestStartDate: '2026-09-01',
  trainingRequestEndDate: '2026-09-30',
})
assert.ok(generalWithGeminiFields)
assert.equal(generalWithGeminiFields.detailCase, 'general')
assert.equal(generalWithGeminiFields.geminiTrainingRequestPeriodLabel, undefined)
assert.equal(generalWithGeminiFields.geminiTrainingRequestStartDate, undefined)
assert.equal(generalWithGeminiFields.geminiTrainingRequestEndDate, undefined)

const geminiTrainingListed = mapPortalProgramListItem({
  programId: 185003,
  programType: 'GEMINI_TRAINING',
  portalCategories: ['ORGANIZATION'],
  title: '제미나이 아카데미 찾아가는 연수 모집',
  recruitmentStatus: 'UPCOMING',
})
assert.ok(geminiTrainingListed)
assert.equal(geminiTrainingListed.category, 'institution')
assert.equal(geminiTrainingListed.recruitmentStatus, 'scheduled')

const mixedTabs = mapPortalProgramListItem({
  programId: 186040,
  title: '기관 진행 · 강사 마감',
  portalCategories: ['ORGANIZATION', 'INSTRUCTOR'],
  recruitmentStatus: 'OPEN',
})
assert.ok(mixedTabs)
assert.deepEqual(mixedTabs.categories, ['instructor', 'institution'])
assert.equal(mixedTabs.categoryLabel, '강사 · 기관')
assert.equal(mixedTabs.category, 'instructor')

const ujatHidesInstructorTab = mapPortalProgramListItem({
  programId: 182199,
  title: 'UJAT',
  programType: 'UJAT',
  portalCategories: ['ORGANIZATION', 'INSTRUCTOR', 'YOUTH_YOUNG'],
  availableApplicationTypes: ['ORGANIZATION', 'INSTRUCTOR', 'VOLUNTEER'],
})
assert.ok(ujatHidesInstructorTab)
assert.deepEqual(ujatHidesInstructorTab.categories, ['institution', 'youth'])
assert.equal(ujatHidesInstructorTab.applicationTypes?.includes('INSTRUCTOR'), false)

const ujatDetailIgnoresInstructorCategory = mapPortalProgramDetail({
  programId: 182199,
  title: 'UJAT',
  programType: 'UJAT',
  portalCategories: ['INSTRUCTOR', 'ORGANIZATION'],
  recruitments: [
    {
      recruitmentId: 182221,
      recruitmentType: 'PARTICIPANT',
      applicationTypes: ['ORGANIZATION'],
    },
  ],
})
assert.ok(ujatDetailIgnoresInstructorCategory)
assert.equal(ujatDetailIgnoresInstructorCategory.detailCase, 'ujat-participant')
assert.deepEqual(ujatDetailIgnoresInstructorCategory.categories, ['institution'])

const closedInstructorStillListed = mapPortalProgramListItem({
  programId: 186041,
  title: '강사 마감 카드',
  portalCategories: ['INSTRUCTOR', 'ORGANIZATION'],
  recruitmentStatus: 'CLOSED',
})
assert.ok(closedInstructorStillListed)
assert.deepEqual(closedInstructorStillListed.categories, ['instructor', 'institution'])
assert.equal(closedInstructorStillListed.recruitmentStatus, 'closed')

const noPublicRecruitment = mapPortalProgramListItem({
  programId: 186042,
  title: '공개 모집 없음',
  programType: 'GENERAL_INDIVIDUAL',
  portalCategories: [],
  recruitmentStatus: 'CLOSED',
})
assert.ok(noPublicRecruitment)
assert.deepEqual(noPublicRecruitment.categories, [])
assert.equal(noPublicRecruitment.categoryLabel, '')

const volunteerYouth = mapPortalProgramDetail({
  programId: 186043,
  title: '대학생 봉사',
  programType: 'GENERAL_INDIVIDUAL',
  portalCategories: ['YOUTH_YOUNG'],
  recruitments: [{ recruitmentType: 'VOLUNTEER', targetType: 'COLLEGE_STUDENT' }],
})
assert.ok(volunteerYouth)
assert.deepEqual(volunteerYouth.categories, ['youth'])
assert.equal(volunteerYouth.detailCase, 'volunteer')

const volunteerSchool = mapPortalProgramListItem({
  programId: 186044,
  title: '학교 봉사',
  portalCategories: ['ORGANIZATION'],
})
assert.ok(volunteerSchool)
assert.deepEqual(volunteerSchool.categories, ['institution'])

const youthClosed = mapPortalProgramDetail(
  {
    programId: 182102,
    title: 'UJAT 기관·봉사',
    programType: 'UJAT',
    portalCategories: ['ORGANIZATION', 'YOUTH_YOUNG'],
    recruitmentStatus: 'OPEN',
    recruitments: [
      {
        recruitmentId: 182221,
        recruitmentType: 'PARTICIPANT',
        targetType: 'SCHOOL',
        status: 'OPEN',
        applicationTypes: ['ORGANIZATION'],
        startAt: '2026-09-20T15:00:00Z',
        endAt: '2026-10-22T14:59:00Z',
      },
      {
        recruitmentId: 182222,
        recruitmentType: 'VOLUNTEER',
        targetType: 'COLLEGE_STUDENT',
        status: 'CLOSED',
        applicationTypes: ['VOLUNTEER'],
        startAt: '2026-11-19T15:00:00Z',
        endAt: '2026-12-15T14:59:00Z',
      },
    ],
  },
  { portalTab: 'YOUTH_YOUNG', recruitmentIds: [182222], applicationTypes: ['VOLUNTEER'] },
)
assert.ok(youthClosed)
assert.deepEqual(youthClosed.categories, ['youth'])
assert.equal(youthClosed.recruitmentStatus, 'closed')
assert.equal(youthClosed.detailCase, 'ujat-volunteer')
assert.equal(youthClosed.applicationType, 'VOLUNTEER')
assert.deepEqual(youthClosed.focusedRecruitmentIds, [182222])
assert.equal(youthClosed.recruitmentSelectionAmbiguous, undefined)
assert.equal(youthClosed.recruitmentPhases.length, 1)
assert.equal(youthClosed.recruitmentPhases[0]?.label, '봉사자 모집 기간')

const focusedVolunteerRecruitment = mapPortalProgramDetail(
  {
    programId: 186290,
    programType: 'UJAT',
    title: '프로그램 공통 제목',
    recruitments: [
      {
        recruitmentId: 186672,
        recruitmentType: 'PARTICIPANT',
        applicationTypes: ['ORGANIZATION'],
        startAt: '2026-01-01T00:00:00Z',
        endAt: '2026-01-31T00:00:00Z',
        recruitmentGuide: '기관 모집 안내',
      },
      {
        recruitmentId: 186674,
        recruitmentType: 'VOLUNTEER',
        applicationTypes: ['VOLUNTEER'],
        startAt: '2026-07-11T15:00:00Z',
        endAt: '2026-12-31T15:00:00Z',
        recruitmentGuide: '하반기 봉사자 신청서를 검토합니다.',
        interviewEnabled: true,
        interviewStartAt: '2026-08-05T15:00:00Z',
        interviewEndAt: '2026-12-31T15:00:00Z',
      },
      {
        recruitmentId: 186673,
        recruitmentType: 'VOLUNTEER',
        applicationTypes: ['VOLUNTEER'],
        startAt: '2026-01-01T15:00:00Z',
        endAt: '2026-06-30T15:00:00Z',
        recruitmentGuide: '상반기 봉사자 신청서입니다.',
      },
    ],
  },
  { recruitmentIds: [186674], applicationTypes: ['VOLUNTEER'] },
)
assert.ok(focusedVolunteerRecruitment)
assert.deepEqual(focusedVolunteerRecruitment.focusedRecruitmentIds, [186674])
assert.equal(focusedVolunteerRecruitment.applicationType, 'VOLUNTEER')
assert.equal(
  focusedVolunteerRecruitment.recruitmentPhases[0]?.value,
  '2026년 7월 12일(일) ~ 2027년 1월 1일(금)',
)
assert.equal(
  focusedVolunteerRecruitment.extraSections.find(section => section.title === '모집 안내')?.body,
  '하반기 봉사자 신청서를 검토합니다.',
)

const mismatchedFocusedRecruitment = mapPortalProgramDetail(
  {
    programId: 186290,
    programType: 'UJAT',
    title: '프로그램 공통 제목',
    recruitments: [
      {
        recruitmentId: 186674,
        recruitmentType: 'VOLUNTEER',
        applicationTypes: ['ORGANIZATION'],
        recruitmentGuide: '다른 신청 유형 안내',
      },
    ],
  },
  { recruitmentIds: [186674], applicationTypes: ['VOLUNTEER'] },
)
assert.equal(mismatchedFocusedRecruitment, null)

const missingFocusedRecruitment = mapPortalProgramDetail(
  {
    programId: 186290,
    programType: 'UJAT',
    title: '프로그램 공통 제목',
    recruitments: [
      {
        recruitmentId: 186673,
        recruitmentType: 'VOLUNTEER',
        applicationTypes: ['VOLUNTEER'],
      },
    ],
  },
  { recruitmentIds: [186674], applicationTypes: ['VOLUNTEER'] },
)
assert.equal(missingFocusedRecruitment, null)

const recruitmentWithoutDates = mapPortalProgramDetail({
  programId: 182224,
  title: '일정 미설정 봉사 프로그램',
  programType: 'GENERAL_INDIVIDUAL',
  recruitments: [
    {
      recruitmentType: 'VOLUNTEER',
      applicationTypes: ['VOLUNTEER'],
    },
  ],
})
assert.ok(recruitmentWithoutDates)
assert.deepEqual(recruitmentWithoutDates.recruitmentPhases, [])
assert.deepEqual(recruitmentWithoutDates.educationSchedules, [])

const scheduleWithoutDetails = mapPortalProgramDetail({
  programId: 182225,
  title: '일정 내용 없음 프로그램',
  programType: 'GENERAL_INDIVIDUAL',
  schedules: [{}],
})
assert.ok(scheduleWithoutDetails)
assert.deepEqual(scheduleWithoutDetails.eventSchedules, [])
assert.deepEqual(scheduleWithoutDetails.educationSchedules, [])

const bothIndividual = mapPortalProgramDetail(
  {
    programId: 186010,
    title: '개인·기관',
    programType: 'GENERAL_INDIVIDUAL',
    portalCategories: ['YOUTH_YOUNG', 'ORGANIZATION'],
    recruitments: [
      {
        recruitmentId: 186050,
        recruitmentType: 'PARTICIPANT',
        targetType: 'BOTH',
        status: 'OPEN',
        applicationTypes: ['INDIVIDUAL', 'ORGANIZATION'],
        startAt: '2026-09-01T00:00:00Z',
        endAt: '2026-10-01T00:00:00Z',
      },
    ],
  },
  { portalTab: 'YOUTH_YOUNG', recruitmentIds: [186050], applicationTypes: ['INDIVIDUAL'] },
)
assert.ok(bothIndividual)
assert.equal(bothIndividual.recruitmentSelectionAmbiguous, undefined)
assert.equal(bothIndividual.applicationType, 'INDIVIDUAL')
assert.equal(bothIndividual.detailCase, 'general')
assert.equal(bothIndividual.recruitmentPhases.length, 1)

const volunteerAmbiguous = mapPortalProgramDetail(
  {
    programId: 182102,
    title: 'UJAT 상·하반기 봉사',
    programType: 'UJAT',
    portalCategories: ['ORGANIZATION', 'YOUTH_YOUNG'],
    recruitmentStatus: 'OPEN',
    recruitments: [
      {
        recruitmentId: 182221,
        recruitmentType: 'PARTICIPANT',
        targetType: 'SCHOOL',
        status: 'OPEN',
        applicationTypes: ['ORGANIZATION'],
      },
      {
        recruitmentId: 182222,
        recruitmentType: 'VOLUNTEER',
        targetType: 'COLLEGE_STUDENT',
        status: 'CLOSED',
        applicationTypes: ['VOLUNTEER'],
      },
      {
        recruitmentId: 182223,
        recruitmentType: 'VOLUNTEER',
        targetType: 'COLLEGE_STUDENT',
        status: 'CLOSED',
        applicationTypes: ['VOLUNTEER'],
      },
    ],
  },
  { portalTab: 'YOUTH_YOUNG', applicationTypes: ['VOLUNTEER'] },
)
assert.ok(volunteerAmbiguous)
assert.equal(volunteerAmbiguous.recruitmentSelectionAmbiguous, true)
assert.equal(volunteerAmbiguous.focusedRecruitmentIds, undefined)
assert.equal(volunteerAmbiguous.applicationType, undefined)
assert.equal(volunteerAmbiguous.recruitmentStatus, 'closed')
assert.equal(volunteerAmbiguous.recruitmentPhases.length, 0)

const listOneToN = [
  mapPortalProgramListItem({
    programId: 100,
    title: 'Program A',
    recruitmentId: 1001,
    applicationType: 'INDIVIDUAL',
    recruitmentType: 'PARTICIPANT',
    targetType: 'INDIVIDUAL',
    recruitmentStatus: 'OPEN',
    portalCategories: ['YOUTH_YOUNG'],
  }),
  mapPortalProgramListItem({
    programId: 100,
    title: 'Program A',
    recruitmentId: 1002,
    applicationType: 'ORGANIZATION',
    recruitmentType: 'PARTICIPANT',
    targetType: 'SCHOOL',
    recruitmentStatus: 'OPEN',
    portalCategories: ['ORGANIZATION'],
  }),
  mapPortalProgramListItem({
    programId: 100,
    title: 'Program A',
    recruitmentId: 1003,
    applicationType: 'VOLUNTEER',
    recruitmentType: 'VOLUNTEER',
    targetType: 'COLLEGE_STUDENT',
    recruitmentStatus: 'CLOSED',
    portalCategories: ['YOUTH_YOUNG'],
  }),
]
assert.equal(listOneToN.length, 3)
assert.ok(listOneToN.every(Boolean))
assert.equal(listOneToN[0]!.id, '100')
assert.equal(listOneToN[1]!.id, '100')
assert.equal(listOneToN[2]!.id, '100')
assert.equal(listOneToN[0]!.recruitmentId, 1001)
assert.equal(listOneToN[1]!.recruitmentId, 1002)
assert.equal(listOneToN[2]!.recruitmentId, 1003)
assert.equal(listOneToN[0]!.applicationType, 'INDIVIDUAL')
assert.equal(listOneToN[1]!.applicationType, 'ORGANIZATION')

const nullGuide = mapPortalProgramDetail(
  {
    programId: 182102,
    title: '프로그램 제목',
    summary: '프로그램 요약',
    description: '프로그램 공통 설명',
    recruitmentGuide: undefined,
    additionalContentHtml: undefined,
    recruitmentStatus: 'CLOSED',
    recruitments: [
      {
        recruitmentId: 182222,
        recruitmentType: 'VOLUNTEER',
        status: 'CLOSED',
        applicationTypes: ['VOLUNTEER'],
      },
    ],
  },
  { recruitmentIds: [182222], applicationTypes: ['VOLUNTEER'], portalTab: 'YOUTH_YOUNG' },
)
assert.ok(nullGuide)
assert.equal(nullGuide.recruitmentStatus, 'closed')
assert.equal(nullGuide.summary, '프로그램 공통 설명')
assert.equal(
  nullGuide.extraSections.some(section => section.title === '모집 안내' || section.title === '추가 내용'),
  false,
)

const orgTabTwoEntries = listOneToN.filter(row => row!.recruitmentId === 1002 || row!.applicationType === 'ORGANIZATION')
assert.equal(orgTabTwoEntries.length, 1)

const trainedTeacherOrg = mapPortalProgramDetail(
  {
    programId: 186016,
    title: '교육받은 교사',
    programType: 'TRAINED_TEACHER',
    portalCategories: ['ORGANIZATION'],
    recruitmentStatus: 'OPEN',
    recruitments: [
      {
        recruitmentId: 186059,
        recruitmentType: 'PARTICIPANT',
        targetType: 'ORGANIZATION',
        status: 'OPEN',
        applicationTypes: ['ORGANIZATION'],
      },
    ],
  },
  { portalTab: 'ORGANIZATION', applicationTypes: ['ORGANIZATION'] },
)
assert.ok(trainedTeacherOrg)
assert.equal(trainedTeacherOrg.category, 'institution')
assert.equal(trainedTeacherOrg.detailCase, 'general')
assert.equal(trainedTeacherOrg.recruitmentRoleLabel, '참여자')
assert.equal(trainedTeacherOrg.applicationType, 'ORGANIZATION')

const rowScopedEmpty = mapPortalProgramDetail(
  {
    programId: 168004,
    title: '프로그램 제목',
    programType: 'GENERAL_ORGANIZATION',
    description: '프로그램 설명',
    summary: '프로그램 요약',
    thumbnailFileObjectId: 999,
    otherMatters: '프로그램 기타사항',
    attachments: [
      { fileObjectId: 168101, originalFileName: 'Primary_Case_04_운영안내.pdf' },
      { fileObjectId: 168102, originalFileName: 'Primary_Case_04_교육자료.pdf' },
    ],
    recruitments: [
      {
        recruitmentId: 168241,
        recruitmentType: 'PARTICIPANT',
        applicationTypes: ['ORGANIZATION'],
        announcementTitle: '참여자 공고',
        programDescription: '참여자 프로그램 설명',
        preEducationNoticeRequired: false,
        recruitmentGuide: '참여자 모집 안내',
        remarks: '참여자 비고',
        attachments: [],
      },
    ],
  },
  { recruitmentIds: [168241], applicationTypes: ['ORGANIZATION'] },
)
assert.ok(rowScopedEmpty)
assert.equal(rowScopedEmpty.title, '참여자 공고')
assert.equal(rowScopedEmpty.preEducationNoticeRequired, false)

const unfocusedOrganizationFlag = mapPortalProgramDetail({
  programId: 168005,
  title: '프로그램 제목',
  programType: 'GENERAL_ORGANIZATION',
  applicationTargetMode: 'ORGANIZATION',
  recruitments: [
    {
      recruitmentId: 168251,
      recruitmentType: 'PARTICIPANT',
      targetType: 'ORGANIZATION',
      applicationTypes: ['ORGANIZATION'],
      preEducationNoticeRequired: false,
      advanceGuidanceRequired: false,
    },
    {
      recruitmentId: 168252,
      recruitmentType: 'INSTRUCTOR',
      targetType: 'TEACHER',
      applicationTypes: ['INSTRUCTOR'],
      preEducationNoticeRequired: true,
    },
  ],
})
assert.equal(unfocusedOrganizationFlag?.preEducationNoticeRequired, false)

const instructorFocusIgnoresOrgFlag = mapPortalProgramDetail(
  {
    programId: 168006,
    title: '프로그램 제목',
    programType: 'GENERAL_ORGANIZATION',
    preEducationNoticeRequired: false,
    recruitments: [
      {
        recruitmentId: 168261,
        recruitmentType: 'PARTICIPANT',
        targetType: 'ORGANIZATION',
        applicationTypes: ['ORGANIZATION'],
        preEducationNoticeRequired: false,
      },
      {
        recruitmentId: 168262,
        recruitmentType: 'INSTRUCTOR',
        targetType: 'TEACHER',
        applicationTypes: ['INSTRUCTOR'],
        announcementTitle: '강사 공고',
        preEducationNoticeRequired: true,
      },
    ],
  },
  { recruitmentIds: [168262], applicationTypes: ['INSTRUCTOR'] },
)
assert.equal(instructorFocusIgnoresOrgFlag?.preEducationNoticeRequired, undefined)

const organizationFocusAudience = mapPortalProgramDetail(
  {
    programId: 168008,
    title: '프로그램 제목',
    programType: 'GENERAL_ORGANIZATION',
    applicationTargetMode: 'INDIVIDUAL',
    recruitments: [
      {
        recruitmentId: 168271,
        recruitmentType: 'PARTICIPANT',
        targetType: 'ORGANIZATION',
        applicationTypes: ['ORGANIZATION'],
        preEducationNoticeRequired: true,
        advanceGuidanceRequired: true,
      },
      {
        recruitmentId: 168272,
        recruitmentType: 'PARTICIPANT',
        targetType: 'INDIVIDUAL',
        applicationTypes: ['INDIVIDUAL'],
      },
    ],
  },
  { applicationTypes: ['ORGANIZATION'], recruitmentIds: [168271] },
)
assert.equal(organizationFocusAudience?.programAudience, 'organization')

const legacyOrganizationFlag = mapPortalProgramDetail({
  programId: 168007,
  title: '프로그램 제목',
  programType: 'GENERAL_ORGANIZATION',
  applicationTargetMode: 'ORGANIZATION',
  recruitments: [
    {
      recruitmentId: 168271,
      recruitmentType: 'PARTICIPANT',
      targetType: 'ORGANIZATION',
      applicationTypes: ['ORGANIZATION'],
    },
  ],
})
assert.equal(legacyOrganizationFlag?.preEducationNoticeRequired, undefined)

const advanceOnlyTrue = mapPortalProgramDetail({
  programId: 168008,
  title: '프로그램 제목',
  programType: 'GENERAL_ORGANIZATION',
  applicationTargetMode: 'ORGANIZATION',
  recruitments: [
    {
      recruitmentId: 168281,
      recruitmentType: 'PARTICIPANT',
      targetType: 'ORGANIZATION',
      applicationTypes: ['ORGANIZATION'],
      advanceGuidanceRequired: true,
    },
  ],
})
assert.equal(advanceOnlyTrue?.preEducationNoticeRequired, true)
assert.equal(advanceOnlyTrue?.advanceGuidanceRequired, true)

const advanceTrueWinsOverPreFalse = mapPortalProgramDetail({
  programId: 168009,
  title: '프로그램 제목',
  programType: 'GENERAL_ORGANIZATION',
  applicationTargetMode: 'ORGANIZATION',
  recruitments: [
    {
      recruitmentId: 168282,
      recruitmentType: 'PARTICIPANT',
      targetType: 'ORGANIZATION',
      applicationTypes: ['ORGANIZATION'],
      preEducationNoticeRequired: false,
      advanceGuidanceRequired: true,
    },
  ],
})
assert.equal(advanceTrueWinsOverPreFalse?.preEducationNoticeRequired, true)

const orgRowWithoutRecruitmentType = mapPortalProgramDetail({
  programId: 168010,
  title: '프로그램 제목',
  programType: 'GENERAL_ORGANIZATION',
  applicationTargetMode: 'ORGANIZATION',
  recruitments: [
    {
      recruitmentId: 168283,
      applicationTypes: ['ORGANIZATION'],
      advanceGuidanceRequired: true,
    },
  ],
})
assert.equal(orgRowWithoutRecruitmentType?.preEducationNoticeRequired, true)
assert.equal(rowScopedEmpty.summary, '참여자 프로그램 설명')
assert.equal(
  rowScopedEmpty.extraSections.some(section => section.title === '프로그램 설명'),
  false
)
assert.equal(
  rowScopedEmpty.extraSections.find(section => section.title === '모집 안내')?.body,
  '참여자 모집 안내'
)
assert.equal(
  rowScopedEmpty.extraSections.find(section => section.title === '비고')?.body,
  '참여자 비고'
)
assert.equal(
  rowScopedEmpty.extraSections.some(section => section.title === '기타사항'),
  false
)
assert.equal(
  rowScopedEmpty.extraSections.some(section => section.title === '학습 지원 내용'),
  false
)
assert.equal(rowScopedEmpty.attachments.length, 0)
assert.equal(rowScopedEmpty.thumbnailUrl, portalPublicFileContentUrl(999))

const rowClearsThumbnail = mapPortalProgramDetail(
  {
    programId: 168004,
    title: '프로그램 제목',
    programType: 'GENERAL_ORGANIZATION',
    thumbnailFileObjectId: 999,
    recruitments: [
      {
        recruitmentId: 168242,
        recruitmentType: 'INSTRUCTOR',
        applicationTypes: ['INSTRUCTOR'],
        thumbnailFileObjectId: null,
      },
    ],
  },
  { recruitmentIds: [168242], applicationTypes: ['INSTRUCTOR'] },
)
assert.ok(rowClearsThumbnail)
assert.equal(rowClearsThumbnail.thumbnailUrl, undefined)

const volunteerInterviewOff = mapPortalProgramDetail(
  {
    programId: 186021,
    programType: 'GENERAL_ORGANIZATION',
    title: '봉사자 공고',
    description: '프로그램 공통 설명',
    learningSupportContent: '참여자 학습 지원',
    otherMatters: '봉사자 기타사항',
    applicationMethod: '<p><br></p>',
    recruitments: [
      {
        recruitmentId: 186070,
        recruitmentType: 'VOLUNTEER',
        applicationTypes: ['VOLUNTEER'],
        programDescription: '<p></p>',
        recruitmentGuide: '봉사자 모집 안내',
        learningSupportContent: '행에 남은 학습 지원',
        additionalContentHtml: '<p><br></p>',
        remarks: '해당 없음',
        interviewEnabled: false,
        documentPassAnnouncementAt: '2026-10-07T00:00:00Z',
        interviewStartAt: '2026-10-07T00:00:00Z',
        interviewEndAt: '2026-10-07T00:00:00Z',
        finalPassAnnouncementAt: '2026-10-11T00:00:00Z',
      },
    ],
  },
  { recruitmentIds: [186070], applicationTypes: ['VOLUNTEER'] },
)
assert.ok(volunteerInterviewOff)
assert.equal(volunteerInterviewOff.detailCase, 'volunteer')
assert.equal(volunteerInterviewOff.summary, '')
assert.equal(volunteerInterviewOff.applicationMethodValue, '')
assert.equal(
  volunteerInterviewOff.extraSections.some(section => section.title === '학습 지원 내용'),
  false
)
assert.equal(
  volunteerInterviewOff.extraSections.find(section => section.title === '기타사항')?.body,
  '봉사자 기타사항'
)
assert.equal(
  volunteerInterviewOff.extraSections.find(section => section.title === '모집 안내')?.body,
  '봉사자 모집 안내'
)
assert.equal(
  volunteerInterviewOff.extraSections.some(
    section => section.title === '추가 내용' || section.title === '비고'
  ),
  false
)
assert.equal(
  volunteerInterviewOff.recruitmentPhases.some(phase => phase.label === '1차 서류 합격자 발표'),
  false
)
assert.equal(
  volunteerInterviewOff.recruitmentPhases.some(phase => phase.label === '2차 면접 기간'),
  false
)
assert.equal(
  volunteerInterviewOff.recruitmentPhases.some(phase => phase.label === '최종 합격자 발표'),
  true
)

const multiRecruitmentPhases = mapPortalProgramDetail({
  programId: 186080,
  title: '강사·봉사자 동시 모집',
  recruitments: [
    {
      recruitmentType: 'INSTRUCTOR',
      startAt: '2026-09-01T00:00:00Z',
      endAt: '2026-09-10T00:00:00Z',
      interviewEnabled: true,
      documentPassAnnouncementAt: '2026-09-12T00:00:00Z',
      interviewStartAt: '2026-09-13T00:00:00Z',
      interviewEndAt: '2026-09-14T00:00:00Z',
      finalPassAnnouncementAt: '2026-09-20T00:00:00Z',
    },
    {
      recruitmentType: 'VOLUNTEER',
      startAt: '2026-09-01T00:00:00Z',
      endAt: '2026-09-15T00:00:00Z',
      interviewEnabled: true,
      documentPassAnnouncementAt: '2026-09-16T00:00:00Z',
      interviewStartAt: '2026-09-17T00:00:00Z',
      interviewEndAt: '2026-09-18T00:00:00Z',
      finalPassAnnouncementAt: '2026-09-25T00:00:00Z',
    },
  ],
})
assert.ok(multiRecruitmentPhases)
const multiPhaseLabels = multiRecruitmentPhases.recruitmentPhases.map(phase => phase.label)
assert.equal(new Set(multiPhaseLabels).size, multiPhaseLabels.length)
assert.equal(
  multiRecruitmentPhases.recruitmentPhases.some(phase => phase.label === '강사 1차 서류 합격자 발표'),
  true
)
assert.equal(
  multiRecruitmentPhases.recruitmentPhases.some(phase => phase.label === '봉사자 2차 면접 기간'),
  true
)
assert.equal(
  multiRecruitmentPhases.recruitmentPhases.some(phase => phase.label === '1차 서류 합격자 발표'),
  false
)

const volunteerInterviewSchedule = mapPortalProgramDetail(
  {
    programId: 186068,
    programType: 'GENERAL_ORGANIZATION',
    title: '봉사자 면접 일정',
    recruitments: [
      {
        recruitmentId: 186142,
        recruitmentType: 'VOLUNTEER',
        applicationTypes: ['VOLUNTEER'],
        interviewEnabled: true,
        interviewStartAt: '2026-11-05T15:00:00Z',
        interviewEndAt: '2026-11-08T15:00:00Z',
        volunteerInterviewSchedule: {
          source: 'SCHEDULE_INFO',
          periodStartDate: '2026-10-01',
          periodEndDate: '2026-11-09',
          availableTimeSlots: '10:00 ~ 10:30',
          recurringUnavailable: '공휴일',
          options: [
            {
              id: 'interview-option:2026-10-12T10:00-10:30',
              label: '26년 10월 12일(월) 10:00 ~ 10:30',
              source: 'SCHEDULE_INFO',
              slotDate: '2026-10-12',
              startAt: '2026-10-12T01:00:00Z',
              endAt: '2026-10-12T01:30:00Z',
            },
          ],
        },
      },
      {
        recruitmentId: 186143,
        recruitmentType: 'INSTRUCTOR',
        applicationTypes: ['INSTRUCTOR'],
        interviewEnabled: false,
      },
    ],
  },
  { recruitmentIds: [186142], applicationTypes: ['VOLUNTEER'] },
)
assert.ok(volunteerInterviewSchedule)
assert.equal(
  volunteerInterviewSchedule.volunteerInterviewSchedule?.periodLabel,
  '2026년 10월 1일(목) ~ 2026년 11월 9일(월)',
)
assert.equal(volunteerInterviewSchedule.volunteerInterviewSchedule?.availableTimeSlots, '10:00 ~ 10:30')
assert.equal(volunteerInterviewSchedule.volunteerInterviewSchedule?.recurringUnavailable, '공휴일')
assert.equal(volunteerInterviewSchedule.volunteerInterviewSchedule?.options.length, 1)
assert.equal(
  volunteerInterviewSchedule.volunteerInterviewSchedule?.options[0]?.label,
  '2026년 10월 12일(월) 10:00 ~ 10:30'
)

const instructorScopedNoInterviewSchedule = mapPortalProgramDetail(
  {
    programId: 186068,
    title: '강사 스코프',
    recruitments: [
      {
        recruitmentId: 186142,
        recruitmentType: 'VOLUNTEER',
        volunteerInterviewSchedule: {
          source: 'SCHEDULE_INFO',
          periodStartDate: '2026-10-01',
          periodEndDate: '2026-11-09',
          availableTimeSlots: '10:00 ~ 10:30',
          options: [],
        },
      },
      {
        recruitmentId: 186143,
        recruitmentType: 'INSTRUCTOR',
        applicationTypes: ['INSTRUCTOR'],
      },
    ],
  },
  { recruitmentIds: [186143], applicationTypes: ['INSTRUCTOR'] },
)
assert.ok(instructorScopedNoInterviewSchedule)
assert.equal(instructorScopedNoInterviewSchedule.volunteerInterviewSchedule, undefined)

const emptyInterviewOptions = mapPortalProgramDetail({
  programId: 186069,
  title: '면접 일정 EMPTY',
  recruitments: [
    {
      recruitmentType: 'VOLUNTEER',
      interviewEnabled: true,
      volunteerInterviewSchedule: {
        source: 'EMPTY',
        periodStartDate: '2026-10-01',
        periodEndDate: '2026-10-31',
        availableTimeSlots: '10:00 ~ 10:30',
        options: [],
      },
    },
  ],
})
assert.ok(emptyInterviewOptions)
assert.equal(emptyInterviewOptions.volunteerInterviewSchedule?.options.length, 0)
assert.equal(emptyInterviewOptions.volunteerInterviewSchedule?.availableTimeSlots, '10:00 ~ 10:30')

assert.equal(volunteerInterviewOff.volunteerInterviewSchedule, undefined)

const volunteerRecruitmentAudience = mapPortalProgramDetail(
  {
    programId: 186250,
    programType: 'GENERAL_ORGANIZATION',
    title: '기관/일정/단일/날짜',
    educationTarget: 'adult',
    recruitmentTarget: '고등학생, 대학(원)생',
    recruitmentTargets: ['high', 'university'],
    recruitmentTargetDetail: '고등학교 1~2학년, 경제·교육 관련 학과 재학생',
    recruitments: [
      {
        recruitmentId: 186602,
        recruitmentType: 'VOLUNTEER',
        applicationTypes: ['VOLUNTEER'],
      },
    ],
  },
  { recruitmentIds: [186602], applicationTypes: ['VOLUNTEER'] },
)
assert.ok(volunteerRecruitmentAudience)
assert.equal(volunteerRecruitmentAudience.detailCase, 'volunteer')
assert.equal(volunteerRecruitmentAudience.educationTargetGroupLabel, '성인')
assert.equal(volunteerRecruitmentAudience.educationTargetDetailLabel, '성인')
assert.equal(
  volunteerRecruitmentAudience.basicInfoFields.find(field => field.label === '모집 대상')?.value,
  '고등학생, 대학(원)생',
)
assert.equal(
  volunteerRecruitmentAudience.basicInfoFields.find(field => field.label === '모집 대상 상세')?.value,
  '고등학교 1~2학년, 경제·교육 관련 학과 재학생',
)
assert.equal(
  volunteerRecruitmentAudience.basicInfoFields.find(field => field.label === '교육 대상')?.value,
  '성인',
)

const volunteerKeepsProgramEducationTarget = mapPortalProgramDetail(
  {
    programId: 186250,
    programType: 'GENERAL_ORGANIZATION',
    title: '기관/일정/단일/날짜',
    educationTarget: 'adult',
    educationTargets: ['adult'],
    educationTargetDetail: '성인 일반',
    recruitmentTarget: '고등학생, 대학(원)생',
    recruitmentTargets: ['high', 'university'],
    recruitmentTargetDetail: '고등학교 1~2학년, 경제·교육 관련 학과 재학생',
    recruitments: [{ recruitmentType: 'VOLUNTEER', applicationTypes: ['VOLUNTEER'] }],
  },
  { applicationTypes: ['VOLUNTEER'] },
)
assert.ok(volunteerKeepsProgramEducationTarget)
assert.deepEqual(volunteerKeepsProgramEducationTarget.educationTargetKeys, ['adult'])
assert.equal(volunteerKeepsProgramEducationTarget.educationTargetLabel, '성인')
assert.equal(volunteerKeepsProgramEducationTarget.educationTargetGroupLabel, '성인')
assert.equal(volunteerKeepsProgramEducationTarget.educationTargetDetailLabel, '성인 일반')
assert.equal(
  volunteerKeepsProgramEducationTarget.basicInfoFields.find(field => field.label === '모집 대상')?.value,
  '고등학생, 대학(원)생',
)
assert.equal(
  volunteerKeepsProgramEducationTarget.basicInfoFields.find(field => field.label === '교육 대상')?.value,
  '성인',
)
assert.equal(
  volunteerKeepsProgramEducationTarget.basicInfoFields.find(field => field.label === '교육 대상 상세')
    ?.value,
  '성인 일반',
)

const volunteerMissingEducationTarget = mapPortalProgramDetail(
  {
    programId: 186250,
    programType: 'GENERAL_ORGANIZATION',
    title: '기관/일정/단일/날짜',
    recruitmentTarget: '고등학생, 대학(원)생',
    recruitmentTargets: ['high', 'university'],
    recruitmentTargetDetail: '고등학교 1~2학년, 경제·교육 관련 학과 재학생',
    recruitments: [{ recruitmentType: 'VOLUNTEER', applicationTypes: ['VOLUNTEER'] }],
  },
  { applicationTypes: ['VOLUNTEER'] },
)
assert.ok(volunteerMissingEducationTarget)
assert.deepEqual(volunteerMissingEducationTarget.educationTargetKeys, [])
assert.equal(
  volunteerMissingEducationTarget.basicInfoFields.find(field => field.label === '모집 대상')?.value,
  '고등학생, 대학(원)생',
)
assert.equal(
  volunteerMissingEducationTarget.basicInfoFields.find(field => field.label === '교육 대상'),
  undefined,
)

const instructorKeepsProgramEducationTarget = mapPortalProgramDetail(
  {
    programId: 186250,
    programType: 'GENERAL_ORGANIZATION',
    title: '기관/일정/단일/날짜',
    educationTargets: ['elementary'],
    educationTargetDetail: '초등학생 4~6학년',
    recruitmentTarget: '강사',
    recruitmentTargets: ['adult'],
    recruitments: [{ recruitmentType: 'INSTRUCTOR', applicationTypes: ['INSTRUCTOR'] }],
  },
  { applicationTypes: ['INSTRUCTOR'] },
)
assert.ok(instructorKeepsProgramEducationTarget)
assert.equal(instructorKeepsProgramEducationTarget.detailCase, 'instructor')
assert.deepEqual(instructorKeepsProgramEducationTarget.categories, ['instructor'])
assert.equal(instructorKeepsProgramEducationTarget.categoryLabel, '강사')
assert.deepEqual(instructorKeepsProgramEducationTarget.educationTargetKeys, ['elementary'])
assert.equal(
  instructorKeepsProgramEducationTarget.basicInfoFields.find(field => field.label === '모집 대상')
    ?.value,
  '강사',
)
assert.equal(
  instructorKeepsProgramEducationTarget.basicInfoFields.find(field => field.label === '교육 대상'),
  undefined,
)
assert.equal(
  instructorKeepsProgramEducationTarget.basicInfoFields.find(
    field => field.label === '교육 대상 상세',
  ),
  undefined,
)

// QA-0198: 강사 모집 상세도 봉사자처럼 모집 대상 아래에 모집 대상 상세를 보인다.
const instructorRecruitmentTargetDetail = mapPortalProgramDetail(
  {
    programId: 186250,
    programType: 'GENERAL_ORGANIZATION',
    title: '기관/일정/단일/날짜',
    educationTargets: ['elementary'],
    recruitmentTarget: '강사',
    recruitmentTargets: ['adult'],
    recruitmentTargetDetail: '경제 교육 경력 1년 이상',
    recruitments: [{ recruitmentType: 'INSTRUCTOR', applicationTypes: ['INSTRUCTOR'] }],
  },
  { applicationTypes: ['INSTRUCTOR'] },
)
assert.ok(instructorRecruitmentTargetDetail)
assert.equal(instructorRecruitmentTargetDetail.detailCase, 'instructor')
{
  const labels = instructorRecruitmentTargetDetail.basicInfoFields.map(field => field.label)
  assert.equal(labels.indexOf('모집 대상 상세'), labels.indexOf('모집 대상') + 1)
}
assert.equal(
  instructorRecruitmentTargetDetail.basicInfoFields.find(field => field.label === '모집 대상')?.value,
  '강사',
)
assert.equal(
  instructorRecruitmentTargetDetail.basicInfoFields.find(field => field.label === '모집 대상 상세')
    ?.value,
  '경제 교육 경력 1년 이상',
)
assert.equal(
  instructorKeepsProgramEducationTarget.basicInfoFields.find(field => field.label === '모집 대상 상세'),
  undefined,
)

// QA-0516: 교육 형태가 온라인이면 교육 장소에 오프라인 주소를 보이지 않고 온라인 안내만 보인다.
const onlineVenue = mapPortalProgramDetail({
  programId: 186310,
  programType: 'GENERAL_INDIVIDUAL',
  title: '온라인 교육',
  educationForm: 'online',
  venue: '서울시 중구 세종대로 110',
  educationPlaceScheduleDetail: 'common',
  educationPlaceAddress: '서울시 영등포구 국제금융로 10',
})
assert.ok(onlineVenue)
assert.equal(onlineVenue.educationVenueLabel, '온라인')
assert.equal(
  onlineVenue.basicInfoFields.find(field => field.label === '교육 장소')?.value,
  '온라인',
)

const hybridVenue = mapPortalProgramDetail({
  programId: 186311,
  programType: 'GENERAL_INDIVIDUAL',
  title: '온/오프라인 교육',
  educationForm: 'hybrid',
  educationPlaceScheduleDetail: 'common',
  educationPlaceAddress: '서울시 영등포구 국제금융로 10',
})
assert.ok(hybridVenue)
assert.equal(hybridVenue.educationVenueLabel, '서울시 영등포구 국제금융로 10')

// 개인 일반 「교육 진행 장소」 — common: 공통 주소가 venue보다 앞서고 행에는 반복하지 않는다.
const educationPlaceCommon = mapPortalProgramDetail({
  programId: 186301,
  programType: 'GENERAL_INDIVIDUAL',
  title: '교육 장소 공통',
  venue: '기존 venue',
  educationPlaceScheduleDetail: 'common',
  educationPlaceAddress: '  서울시 중구 세종대로 110  ',
  educationStructure: 'curriculum',
  sessionRound: 'multi',
  curriculumSessions: [
    { sessionLabel: '1차시', title: '첫 차시', description: '', educationPlaceAddress: '반복 금지' },
  ],
})
assert.ok(educationPlaceCommon)
assert.equal(educationPlaceCommon.educationVenueLabel, '서울시 중구 세종대로 110')
assert.equal(
  educationPlaceCommon.basicInfoFields.find(field => field.label === '교육 장소')?.value,
  '서울시 중구 세종대로 110'
)
assert.equal(educationPlaceCommon.sessions[0]?.educationPlaceLabel, undefined)

// 모드 없이 주소만 있으면 common처럼 본다.
const educationPlaceAddressOnly = mapPortalProgramDetail({
  programId: 186302,
  programType: 'GENERAL_INDIVIDUAL',
  title: '교육 장소 주소만',
  venue: '기존 venue',
  educationPlaceAddress: '부산시 해운대구',
})
assert.ok(educationPlaceAddressOnly)
assert.equal(educationPlaceAddressOnly.educationVenueLabel, '부산시 해운대구')

// perSchedule: 단일 「교육 장소」를 숨기고(첫 일정 주소 폴백 없음) 교육 행마다, 사전 교육 행은 제외.
const educationPlacePerSchedule = mapPortalProgramDetail({
  programId: 186303,
  programType: 'GENERAL_INDIVIDUAL',
  title: '교육 장소 일정별',
  educationPlaceScheduleDetail: 'perSchedule',
  educationPlaceAddress: null,
  schedules: [
    {
      scheduleName: '운영 회차',
      publiclyVisible: true,
      address: '첫 일정 주소',
      startAt: '2026-11-02T10:00:00+09:00',
      endAt: '2026-11-02T12:00:00+09:00',
    },
  ],
  educationStructure: 'schedule',
  sessionRound: 'multi',
  scheduleDetails: [
    {
      scheduleLabel: '사전 교육',
      blockKind: 'preEducation',
      name: '사전 안내',
      scheduleDateLabel: '26년 11월 1일(일)',
      educationPlaceAddress: '사전 교육 주소',
    },
    {
      scheduleLabel: '세부 일정 01',
      blockKind: 'sub',
      name: '첫 일정',
      scheduleDateLabel: '26년 11월 2일(월) 10:00 ~ 12:00',
      educationPlaceAddress: ' 서울 강남구 ',
    },
    {
      scheduleLabel: '세부 일정 02',
      blockKind: 'sub',
      name: '둘째 일정',
      scheduleDateLabel: '26년 11월 9일(월) 10:00 ~ 12:00',
      educationPlaceAddress: '경기 성남시',
    },
  ],
})
assert.ok(educationPlacePerSchedule)
assert.equal(educationPlacePerSchedule.educationVenueLabel, '')
assert.equal(
  educationPlacePerSchedule.basicInfoFields.some(field => field.label === '교육 장소'),
  false
)
assert.equal(educationPlacePerSchedule.eventSchedules[0]?.educationPlaceLabel, undefined)
assert.equal(educationPlacePerSchedule.eventSchedules[0]?.scheduleLabel, '사전교육')
assert.equal(educationPlacePerSchedule.eventSchedules[1]?.scheduleLabel, '행사 일정 01')
assert.equal(educationPlacePerSchedule.eventSchedules[1]?.educationPlaceLabel, '서울 강남구')
assert.equal(educationPlacePerSchedule.eventSchedules[2]?.educationPlaceLabel, '경기 성남시')

const educationPlacePerScheduleCurriculum = mapPortalProgramDetail({
  programId: 186304,
  programType: 'GENERAL_INDIVIDUAL',
  title: '교육 장소 일정별 커리큘럼',
  educationPlaceScheduleDetail: 'perSchedule',
  educationStructure: 'curriculum',
  sessionRound: 'multi',
  curriculumSessions: [
    { sessionLabel: '사전 교육', title: '사전', description: '', educationPlaceAddress: '사전 주소' },
    { sessionLabel: '1차시', title: '첫 차시', description: '', educationPlaceAddress: '대전 유성구' },
  ],
})
assert.ok(educationPlacePerScheduleCurriculum)
assert.equal(educationPlacePerScheduleCurriculum.sessions[0]?.educationPlaceLabel, undefined)
assert.equal(educationPlacePerScheduleCurriculum.sessions[0]?.sessionLabel, '사전교육')
assert.equal(educationPlacePerScheduleCurriculum.sessions[1]?.sessionLabel, '1차시')

// 사전 교육 일정명이 기본값(사전 교육)이면 「사전교육 사전 교육」으로 겹치지 않게 이름을 비운다.
const preEducationDefaultName = mapPortalProgramDetail({
  programId: 186486,
  programType: 'GENERAL_INDIVIDUAL',
  title: '사전교육 기본 이름',
  educationStructure: 'schedule',
  sessionRound: 'single',
  scheduleDetails: [
    {
      scheduleLabel: '사전 교육',
      blockKind: 'preEducation',
      name: '사전 교육',
      scheduleDateLabel: '2026.10.30(금) 12:00 ~ 13:08',
    },
    {
      scheduleLabel: '세부 일정 01',
      name: '필요와 욕구, 현명한 소비',
      scheduleDateLabel: '2026.11.16(월) 10:00 ~ 12:00',
    },
  ],
})
assert.ok(preEducationDefaultName)
assert.equal(preEducationDefaultName.eventSchedules[0]?.scheduleLabel, '사전교육')
assert.equal(preEducationDefaultName.eventSchedules[0]?.name, '')
assert.equal(preEducationDefaultName.eventSchedules[1]?.scheduleLabel, '세부 일정 01')
assert.equal(preEducationDefaultName.eventSchedules[1]?.name, '필요와 욕구, 현명한 소비')
assert.equal(educationPlacePerScheduleCurriculum.sessions[1]?.educationPlaceLabel, '대전 유성구')

// 새 필드가 없으면 기존 순서(venue → 첫 일정 주소) 유지.
const educationPlaceLegacy = mapPortalProgramDetail({
  programId: 186305,
  programType: 'GENERAL_INDIVIDUAL',
  title: '교육 장소 레거시',
  schedules: [
    {
      scheduleName: '운영 회차',
      publiclyVisible: true,
      address: '첫 일정 주소',
      startAt: '2026-11-02T10:00:00+09:00',
      endAt: '2026-11-02T12:00:00+09:00',
    },
  ],
})
assert.ok(educationPlaceLegacy)
assert.equal(educationPlaceLegacy.educationVenueLabel, '첫 일정 주소')

// 커리큘럼 행 「차시」 — 차시 정보(양의 정수 title)가 있을 때만 붙인다
const curriculumMulti = { educationStructure: 'curriculum', sessionRound: 'multi' } as const
assert.equal(curriculumSessionTitle(curriculumMulti, { sessionLabel: '1회차', title: '1' }), '1차시')
assert.equal(curriculumSessionTitle(curriculumMulti, { sessionLabel: '2회차', title: ' 2차시 ' }), '2차시')
assert.equal(
  curriculumSessionTitle(curriculumMulti, { sessionLabel: '사전 교육', title: '오리엔테이션' }),
  '오리엔테이션'
)
assert.equal(
  curriculumSessionTitle(curriculumMulti, { sessionLabel: '', title: '사전 교육' }),
  '사전 교육'
)
assert.equal(
  curriculumSessionTitle(curriculumMulti, { sessionLabel: '1회차', title: 'AI 기초 이해' }),
  'AI 기초 이해'
)
assert.equal(curriculumSessionTitle(curriculumMulti, { sessionLabel: '1회차', title: '' }), '')
assert.equal(curriculumSessionTitle(curriculumMulti, { sessionLabel: '1회차', title: '0' }), '0')
assert.equal(
  curriculumSessionTitle(
    { educationStructure: 'curriculum', sessionRound: 'single' },
    { sessionLabel: '1차시', title: ' AI 기초 이해 ' }
  ),
  'AI 기초 이해'
)
assert.equal(
  curriculumSessionTitle(
    { educationStructure: 'curriculum', sessionRound: 'single' },
    { sessionLabel: '1차시', title: '1' }
  ),
  '1'
)

// ── QA #57·#65: 모집 행 발표·면접 방법(CMS 원문 라벨) — 날짜 뒤 「, 」 (Figma 11001:200154·200159·200164)
{
  assert.equal(withRecruitmentMethod('D', '홈페이지 공지'), 'D, 홈페이지 공지')
  assert.equal(withRecruitmentMethod('D', null), 'D')
  assert.equal(withRecruitmentMethod('D', undefined), 'D')
  assert.equal(withRecruitmentMethod('D', '   '), 'D')

  const phaseValue = (detail: ReturnType<typeof mapPortalProgramDetail>, label: string) =>
    detail?.recruitmentPhases.find(phase => phase.label === label)?.value
  const volunteerRow = {
    recruitmentId: 187017,
    recruitmentType: 'VOLUNTEER',
    applicationTypes: ['VOLUNTEER'],
    startAt: '2026-03-01T00:00:00Z',
    endAt: '2026-03-10T00:00:00Z',
    interviewEnabled: true,
    documentPassAnnouncementAt: '2026-03-15T15:00:00Z',
    interviewStartAt: '2026-03-17T15:00:00Z',
    interviewEndAt: '2026-03-19T15:00:00Z',
    finalPassAnnouncementAt: '2026-03-22T15:00:00Z',
  }

  // 1) 방법 있음 → 날짜, 방법 (원문 그대로)
  const withMethods = mapPortalProgramDetail({
    programId: 186298,
    title: '방법 있음',
    recruitments: [
      {
        ...volunteerRow,
        documentPassAnnouncementMethod: '홈페이지 공지',
        interviewMethod: '온/오프라인',
        finalPassAnnouncementMethod: '문자 안내',
      },
    ],
  })
  assert.ok(phaseValue(withMethods, '1차 서류 합격자 발표')?.endsWith(', 홈페이지 공지'))
  assert.ok(phaseValue(withMethods, '2차 면접 기간')?.endsWith(', 온/오프라인'))
  assert.ok(phaseValue(withMethods, '최종 합격자 발표')?.endsWith(', 문자 안내'))

  // 2) null → 날짜만, 3) 키 없음 → 날짜만 (두 결과가 같아야 함)
  const nullMethods = mapPortalProgramDetail({
    programId: 186482,
    title: '방법 null',
    recruitments: [
      {
        ...volunteerRow,
        documentPassAnnouncementMethod: null,
        interviewMethod: null,
        finalPassAnnouncementMethod: null,
      },
    ],
  })
  const missingMethods = mapPortalProgramDetail({
    programId: 186482,
    title: '방법 키 없음',
    recruitments: [{ ...volunteerRow }],
  })
  assert.ok(nullMethods && missingMethods)
  assert.deepEqual(nullMethods.recruitmentPhases, missingMethods.recruitmentPhases)
  for (const phase of nullMethods.recruitmentPhases) assert.ok(!phase.value.includes(', '))
  assert.equal(
    phaseValue(withMethods, '최종 합격자 발표'),
    `${phaseValue(nullMethods, '최종 합격자 발표')}, 문자 안내`
  )

  // 4) interviewEnabled !== true → 서류 발표 방법·면접 방식 숨김, 최종 방법은 표시
  const interviewOffMethods = mapPortalProgramDetail({
    programId: 8732,
    title: '면접 없음',
    recruitments: [
      {
        ...volunteerRow,
        interviewEnabled: false,
        documentPassAnnouncementMethod: '홈페이지 공지',
        interviewMethod: '온라인',
        finalPassAnnouncementMethod: '문자 안내',
      },
    ],
  })
  assert.equal(phaseValue(interviewOffMethods, '1차 서류 합격자 발표'), undefined)
  assert.equal(phaseValue(interviewOffMethods, '2차 면접 기간'), undefined)
  assert.ok(phaseValue(interviewOffMethods, '최종 합격자 발표')?.endsWith(', 문자 안내'))
  const interviewNullMethods = mapPortalProgramDetail({
    programId: 8733,
    title: '면접 여부 null',
    recruitments: [
      {
        ...volunteerRow,
        interviewEnabled: null,
        documentPassAnnouncementMethod: '홈페이지 공지',
        interviewMethod: '온라인',
        finalPassAnnouncementMethod: null,
      },
    ],
  })
  assert.ok(phaseValue(interviewNullMethods, '1차 서류 합격자 발표'))
  assert.ok(!phaseValue(interviewNullMethods, '1차 서류 합격자 발표')?.includes('홈페이지 공지'))
  assert.ok(!phaseValue(interviewNullMethods, '2차 면접 기간')?.includes('온라인'))

  // 5) 행 섞임 없음 — 상·하반기 행이 각자 값만 사용
  const twoTerms = mapPortalProgramDetail({
    programId: 186482,
    title: '상·하반기',
    recruitments: [
      { ...volunteerRow, recruitmentId: 187017, finalPassAnnouncementMethod: '문자 안내' },
      {
        ...volunteerRow,
        recruitmentId: 187018,
        documentPassAnnouncementAt: '2026-08-02T15:00:00Z',
        finalPassAnnouncementAt: '2026-08-12T15:00:00Z',
        documentPassAnnouncementMethod: '이메일 안내',
        finalPassAnnouncementMethod: null,
      },
    ],
  })
  assert.ok(phaseValue(twoTerms, '봉사자1 최종 합격자 발표')?.endsWith(', 문자 안내'))
  assert.ok(!phaseValue(twoTerms, '봉사자1 1차 서류 합격자 발표')?.includes('이메일 안내'))
  assert.ok(phaseValue(twoTerms, '봉사자2 1차 서류 합격자 발표')?.endsWith(', 이메일 안내'))
  assert.ok(!phaseValue(twoTerms, '봉사자2 최종 합격자 발표')?.includes(', '))

  const halfTerms = mapPortalProgramDetail({
    programId: 186483,
    title: '상·하반기 recruitTerm',
    recruitments: [
      {
        ...volunteerRow,
        recruitmentId: 187017,
        recruitTerm: 'FIRST_HALF',
        finalPassAnnouncementMethod: '문자 안내',
      },
      {
        ...volunteerRow,
        recruitmentId: 187018,
        recruitTerm: 'SECOND_HALF',
        documentPassAnnouncementAt: '2026-08-02T15:00:00Z',
        finalPassAnnouncementAt: '2026-08-12T15:00:00Z',
        documentPassAnnouncementMethod: '이메일 안내',
        finalPassAnnouncementMethod: null,
      },
    ],
  })
  assert.ok(phaseValue(halfTerms, '상반기 봉사자 모집'))
  assert.ok(phaseValue(halfTerms, '하반기 봉사자 모집'))
  assert.ok(phaseValue(halfTerms, '상반기 봉사자 최종 합격자 발표')?.endsWith(', 문자 안내'))
  assert.ok(phaseValue(halfTerms, '하반기 봉사자 1차 서류 합격자 발표')?.endsWith(', 이메일 안내'))
  assert.equal(phaseValue(halfTerms, '봉사자1 최종 합격자 발표'), undefined)
  assert.equal(phaseValue(halfTerms, '봉사자2 1차 서류 합격자 발표'), undefined)

  // 참여자·강사 행도 봉사자와 같은 통일 라벨 (지원님 결정 2026-10-30)
  const participantLabels = mapPortalProgramDetail({
    programId: 186299,
    title: '참여자 라벨',
    recruitments: [{ ...volunteerRow, recruitmentType: 'PARTICIPANT', applicationTypes: ['PARTICIPANT'] }],
  })
  assert.ok(phaseValue(participantLabels, '1차 서류 합격자 발표'))
  assert.ok(phaseValue(participantLabels, '2차 면접 기간'))
  assert.ok(phaseValue(participantLabels, '최종 합격자 발표'))
  assert.equal(phaseValue(participantLabels, '1차 합격자 발표일'), undefined)
  assert.equal(phaseValue(participantLabels, '면접 기간'), undefined)
  const instructorLabels = mapPortalProgramDetail({
    programId: 186300,
    title: '강사 라벨',
    recruitments: [{ ...volunteerRow, recruitmentType: 'INSTRUCTOR', applicationTypes: ['INSTRUCTOR'] }],
  })
  assert.ok(phaseValue(instructorLabels, '1차 서류 합격자 발표'))
  assert.ok(phaseValue(instructorLabels, '2차 면접 기간'))
  const participantNoInterview = mapPortalProgramDetail({
    programId: 186301,
    title: '참여자 면접 없음',
    recruitments: [
      { ...volunteerRow, recruitmentType: 'PARTICIPANT', applicationTypes: ['PARTICIPANT'], interviewEnabled: false },
    ],
  })
  assert.equal(phaseValue(participantNoInterview, '1차 서류 합격자 발표'), undefined)
  assert.equal(phaseValue(participantNoInterview, '2차 면접 기간'), undefined)
  assert.ok(phaseValue(participantNoInterview, '최종 합격자 발표'))
}

// QA-0210: 마이페이지 신청 카드가 쓰는 배지 라벨 함수는 상세 헤더 배지와 같은 값을 낸다.
{
  const audienceCases: Array<
    Pick<
      PortalProgramDetail,
      'educationTargets' | 'educationForm' | 'educationFormLabel' | 'educationFormScheduleDetail'
    >
  > = [
    { educationTargets: ['elementary', 'university'], educationForm: 'online', educationFormLabel: '온라인', educationFormScheduleDetail: 'common' },
    { educationTargets: ['adult'], educationForm: 'hybrid', educationFormLabel: null, educationFormScheduleDetail: 'common' },
    { educationTargets: [], educationForm: 'offline', educationFormLabel: null, educationFormScheduleDetail: 'perSchedule' },
  ]
  for (const audience of audienceCases) {
    const detail = mapPortalProgramDetail({
      programId: 186900,
      programType: 'GENERAL_INDIVIDUAL',
      title: '교육대상·형태 일치',
      ...audience,
    } as PortalProgramDetail)
    assert.ok(detail)
    const badge = mapPortalProgramEducationBadgeLabels(audience)
    assert.equal(badge.educationTargetLabel, detail.educationTargetLabel)
    assert.equal(badge.educationForm, detail.educationForm)
    assert.equal(badge.educationFormLabel, detail.educationFormLabel)
  }
  assert.equal(
    mapPortalProgramEducationBadgeLabels({ educationTargets: ['elementary', 'university'] }).educationTargetLabel,
    '초등학교, 대학(원)생',
  )
}

console.log('program portal mappers.selfcheck: ok')
