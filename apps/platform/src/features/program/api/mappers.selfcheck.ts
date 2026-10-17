/**
 * CMS Portal 프로그램 상세 매퍼
 *
 * 숫자 programId·title 없는 페이로드는 버린다.
 * 홈 카드 클릭은 CMS 숫자 id → GET /api/portal/programs/{id}.
 */
import assert from 'node:assert/strict'
import type { PortalProgramDetail } from './types.ts'
import {
  mapPortalProgramDetail,
  mapPortalProgramListItem,
  parsePortalProgramId,
  portalPublicFileContentUrl,
} from './mappers.ts'

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
  withSelection.recruitmentPhases.some(phase => phase.label === '1차 합격자 발표일'),
  false
)
assert.equal(
  withSelection.recruitmentPhases.some(phase => phase.label === '최종 합격자 발표'),
  true
)
assert.equal(withSelection.eventSchedules.length, 1)
assert.equal(withSelection.eventSchedules[0]?.name, '사전교육 전반 오리엔테이션')

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
assert.equal(generalCurriculum.sessions[0]?.ipsTypeSummary, undefined)
assert.equal(generalCurriculum.sessions[0]?.assignmentPeriod, undefined)
assert.equal(generalCurriculum.sessions[1]?.title, '')
assert.equal(generalCurriculum.eventSchedules.length, 0)
assert.deepEqual(generalCurriculum.educationScheduleLines, [
  '26년 10월 13일(화) 10:00 ~ 12:00',
  '26년 10월 20일(화) 13:30 ~ 16:00',
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
  educationScheduleLines: ['26년 11월 19일(목) 0:00 ~ 26년 11월 30일(월) 23:59'],
  curriculumSessions: [],
  scheduleDetails: [],
})
assert.ok(periodEducationSchedule)
assert.equal(periodEducationSchedule.educationSchedules.length, 1)
assert.equal(periodEducationSchedule.educationSchedules[0]?.label, '교육 일정')
assert.equal(
  periodEducationSchedule.educationSchedules[0]?.value,
  '26년 11월 19일(목) ~ 26년 11월 30일(월)'
)
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
assert.equal(scheduleMulti.educationFormLabel, '')
assert.equal(
  scheduleMulti.basicInfoFields.some(field => field.label === '교육 형태'),
  false
)
assert.equal(scheduleMulti.eventSchedules[0]?.blockKind, 'preEducation')
assert.equal(scheduleMulti.eventSchedules[0]?.scheduleLabel, '행사 일정 01')
assert.equal(scheduleMulti.eventSchedules[0]?.educationFormLabel, '온라인')
assert.equal(scheduleMulti.eventSchedules[0]?.dateLabel, '26년 9월 29일(화)')
assert.equal(scheduleMulti.eventSchedules[1]?.educationFormLabel, '오프라인')
assert.equal(scheduleMulti.eventSchedules[1]?.dateLabel, '26년 10월 6일(화) 13:00 ~ 15:00')
assert.equal(scheduleMulti.educationSchedules.length, 0)
assert.deepEqual(scheduleMulti.educationScheduleLines, ['26년 9월 29일(화) 10:00 ~ 12:00'])

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
  '그룹 A : 09:30 ~ 09:40 | 그룹 B : 13:00 ~ 13:10'
)

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
assert.equal(organization.sessions[0]?.sessionLabel, '사전 교육')

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
assert.equal(
  trainedTeacherProgress.educationVenueLabel,
  '기관 안 | 서울시 강서구 가양 데시앙플렉스'
)
assert.equal(trainedTeacherProgress.detailCase, 'instructor')
assert.equal(trainedTeacherProgress.educationStructure, 'curriculum')
assert.equal(trainedTeacherProgress.sessions.length, 1)
assert.equal(trainedTeacherProgress.sessions[0]?.title, '수정3')
assert.equal(trainedTeacherProgress.sessions[0]?.educationFormLabel, undefined)
assert.equal(trainedTeacherProgress.sessions[0]?.ipsTypeSummary, undefined)
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
assert.deepEqual(trainedTeacherProgress.educationScheduleLines, [
  '26년 10월 13일(화) 10:00 ~ 12:00',
  '26년 10월 20일(화) 13:30 ~ 16:00',
])
assert.equal(
  trainedTeacherProgress.extraSections.find(section => section.title === '기타사항')?.body,
  '우천·학교 행사와 겹치면 일정을 조정할 수 있습니다.'
)
assert.equal(
  trainedTeacherProgress.extraSections.find(section => section.title === '비고')?.body,
  '신청 전 학교 담당 교사 확인이 필요합니다.'
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
  participantCatalog.recruitmentPhases.some(phase => phase.label === '1차 합격자 발표일'),
  false
)
assert.equal(
  participantCatalog.recruitmentPhases.some(phase => phase.label === '면접 기간'),
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
})
assert.ok(geminiTraining)
assert.equal(geminiTraining.detailCase, 'gemini')
assert.equal(geminiTraining.category, 'institution')

const geminiTrainingListed = mapPortalProgramListItem({
  programId: 185003,
  programType: 'GEMINI_TRAINING',
  portalCategories: ['ORGANIZATION'],
  title: '제미나이 아카데미 찾아가는 연수 모집',
  recruitmentStatus: 'UPCOMING',
  featuredOnHome: true,
  homeDisplayOrder: 1,
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
  volunteerInterviewOff.recruitmentPhases.some(phase => phase.label === '1차 합격자 발표일'),
  false
)
assert.equal(
  volunteerInterviewOff.recruitmentPhases.some(phase => phase.label === '면접 기간'),
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
  multiRecruitmentPhases.recruitmentPhases.some(phase => phase.label === '강사 1차 합격자 발표일'),
  true
)
assert.equal(
  multiRecruitmentPhases.recruitmentPhases.some(phase => phase.label === '봉사자 면접 기간'),
  true
)
assert.equal(
  multiRecruitmentPhases.recruitmentPhases.some(phase => phase.label === '1차 합격자 발표일'),
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
assert.equal(volunteerInterviewSchedule.volunteerInterviewSchedule?.periodLabel, '2026.10.01 – 2026.11.09')
assert.equal(volunteerInterviewSchedule.volunteerInterviewSchedule?.availableTimeSlots, '10:00 ~ 10:30')
assert.equal(volunteerInterviewSchedule.volunteerInterviewSchedule?.recurringUnavailable, '공휴일')
assert.equal(volunteerInterviewSchedule.volunteerInterviewSchedule?.options.length, 1)
assert.equal(
  volunteerInterviewSchedule.volunteerInterviewSchedule?.options[0]?.label,
  '26년 10월 12일(월) 10:00 ~ 10:30'
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

console.log('program portal mappers.selfcheck: ok')
