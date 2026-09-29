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

assert.equal(mapped.sponsor, '현대 자동차')
assert.equal(mapped.detailCase, 'general')
assert.equal(mapped.educationStructure, 'curriculum')
assert.equal(mapped.sessions.length, 0)
assert.equal(mapped.eventSchedules.length, 0)
assert.equal(mapped.educationScheduleMode, 'date')
assert.deepEqual(mapped.educationScheduleLines, [])
assert.equal(
  mapped.basicInfoFields.some(field => field.label === '교육 형태'),
  false,
)
assert.equal(mapped.thumbnailUrl, portalPublicFileContentUrl(77))
assert.equal(mapped.attachments[0]?.url, '/api/portal/public/files/88/download')
assert.equal(mapped.contactValue, '02-6085-6028 · cc@jakorea.org')
assert.equal(mapped.participationMethod, 'team')
assert.ok(mapped.extraSections.some(section => section.title === '추가 내용'))

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

const generalCurriculum = mapPortalProgramDetail({
  programId: 186021,
  programType: 'GENERAL_INDIVIDUAL',
  title: '필요와 욕구',
  operationMethod: 'OFFLINE',
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
      ipsTypeSummary: 'Succeed | Conference (컨퍼런스)',
    },
    { sessionLabel: '2차시', title: '', description: '' },
  ],
  scheduleDetails: [],
  educationScheduleMode: 'date',
  educationScheduleLines: [
    '26년 10월 13일(화) 10:00 ~ 12:00',
    '26년 10월 20일(화) 13:30 ~ 16:00',
  ],
  educationScheduleRange: null,
})
assert.ok(generalCurriculum)
assert.equal(generalCurriculum.sessions.length, 2)
assert.equal(generalCurriculum.sessions[0]?.title, '필요와 욕구, 현명한 소비')
assert.equal(generalCurriculum.sessions[0]?.ipsTypeSummary, 'Succeed | Conference (컨퍼런스)')
assert.equal(generalCurriculum.sessions[1]?.title, '')
assert.equal(generalCurriculum.eventSchedules.length, 0)
assert.deepEqual(generalCurriculum.educationScheduleLines, [
  '26년 10월 13일(화) 10:00 ~ 12:00',
  '26년 10월 20일(화) 13:30 ~ 16:00',
])
assert.deepEqual(
  generalCurriculum.educationSchedules.map(item => item.value),
  generalCurriculum.educationScheduleLines,
)
assert.equal(generalCurriculum.educationFormLabel, '온라인')
assert.equal(generalCurriculum.participationMethod, 'individual')
assert.equal(
  generalCurriculum.basicInfoFields.find(field => field.label === '교육 형태')?.value,
  '온라인',
)
assert.equal(
  generalCurriculum.basicInfoFields.find(field => field.label === '참여 방식')?.value,
  '개인',
)
assert.equal(
  generalCurriculum.basicInfoFields.some(field => field.label === 'IPS 유형'),
  false,
)
assert.equal(
  generalCurriculum.extraSections.find(section => section.title === '비고')?.body,
  '일정은 학교 사정에 따라 조율할 수 있습니다.',
)
assert.equal(
  generalCurriculum.extraSections.find(section => section.title === '기타사항')?.body,
  '기타 안내',
)

const scheduleMulti = mapPortalProgramDetail({
  programId: 186017,
  programType: 'GENERAL_INDIVIDUAL',
  title: '일정형',
  educationStructure: 'schedule',
  sessionRound: 'multi',
  educationScheduleLines: ['26년 9월 29일(화) 10:00 ~ 12:00'],
  scheduleDetails: [
    {
      scheduleLabel: '사전 교육',
      blockKind: 'preEducation',
      name: '오리엔테이션',
      scheduleDateLabel: '26년 9월 29일(화)',
    },
  ],
})
assert.ok(scheduleMulti)
assert.equal(scheduleMulti.sessions.length, 0)
assert.equal(scheduleMulti.eventSchedules[0]?.blockKind, 'preEducation')
assert.equal(scheduleMulti.eventSchedules[0]?.dateLabel, '26년 9월 29일(화)')
assert.equal(scheduleMulti.educationSchedules.length, 0)
assert.deepEqual(scheduleMulti.educationScheduleLines, ['26년 9월 29일(화) 10:00 ~ 12:00'])

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
  false,
)
assert.equal(organization.sessions[0]?.sessionLabel, '사전 교육')

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
assert.equal(trainedTeacher.educationScheduleMode, 'period')

console.log('program portal mappers.selfcheck: ok')
