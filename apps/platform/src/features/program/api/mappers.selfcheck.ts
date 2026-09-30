/**
 * CMS Portal 프로그램 상세 매퍼
 *
 * 숫자 programId·title 없는 페이로드는 버린다.
 * 홈 카드 클릭은 CMS 숫자 id → GET /api/portal/programs/{id}.
 */
import assert from 'node:assert/strict'
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
    '<p>추가 안내</p><p><span style="color: rgb(229, 57, 53);">red</span><br><span data-name="grinning" data-type="emoji">😀</span></p>',
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
  false
)
assert.equal(mapped.thumbnailUrl, portalPublicFileContentUrl(77))
assert.equal(mapped.attachments[0]?.url, '/api/portal/public/files/88/download')
assert.equal(mapped.contactValue, 'JA Korea, Tel : 02-6085-6028, E-mail : cc@jakorea.org')
assert.equal(mapped.participationMethod, 'team')
assert.deepEqual(
  mapped.extraSections.map(section => section.title),
  ['모집 안내', '추가 내용']
)
assert.deepEqual(
  mapped.extraSections.find(section => section.title === '추가 내용'),
  {
    title: '추가 내용',
    body: '<p>추가 안내</p><p><span style="color: rgb(229, 57, 53);">red</span><br><span data-name="grinning" data-type="emoji">😀</span></p>',
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
  generalCurriculum.extraSections.find(section => section.title === '기타사항')?.body,
  '기타 안내'
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

console.log('program portal mappers.selfcheck: ok')
