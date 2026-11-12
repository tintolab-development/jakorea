import assert from 'node:assert/strict'
import { mapPortalEducationSchedule } from './map-from-portal.ts'

const withId = mapPortalEducationSchedule(
  {
    scheduleId: 12,
    sessionNo: 2,
    title: '1차 교육',
    startAt: '2026-04-04T10:00:00+09:00',
    endAt: '2026-04-04T12:00:00+09:00',
    locationName: '서울',
    attendanceStatus: 'PRESENT',
  },
  0,
)
assert.equal(withId.id, '12')
assert.equal(withId.sessionNumber, 2)
assert.equal(withId.title, '1차 교육')
assert.equal(withId.heldAt, '2026-04-04T10:00:00+09:00')
assert.equal(withId.endAt, '2026-04-04T12:00:00+09:00')
assert.equal(withId.attendanceStatus, 'present')
assert.equal(withId.absenceReason, undefined)
assert.equal(withId.assignment, undefined)

const lateCorrected = mapPortalEducationSchedule(
  {
    scheduleId: 187626,
    attendanceStatus: 'LATE',
    absenceReasonStatus: 'NOT_REQUIRED',
    absenceReason: '예전 결석 사유',
    availableActions: ['VIEW_ATTENDANCE'],
  },
  0,
)
assert.equal(lateCorrected.attendanceStatus, 'late')
assert.equal(lateCorrected.absenceReasonStatus, 'NOT_REQUIRED')
assert.equal(lateCorrected.absenceReason, undefined)

const absentCorrected = mapPortalEducationSchedule(
  {
    scheduleId: 187273,
    attendanceStatus: 'ABSENT',
    absenceReasonStatus: 'NOT_REQUIRED',
    absenceReason: '늦잠',
    availableActions: ['VIEW_ATTENDANCE'],
  },
  0,
)
assert.equal(absentCorrected.attendanceStatus, 'absent')
assert.equal(absentCorrected.absenceReason, undefined)

const noScheduleId = mapPortalEducationSchedule(
  {
    sessionNo: 3,
    startAt: '2026-04-05T10:00:00',
    locationName: '부산센터',
    attendanceStatus: 'EXCUSED',
    absenceReason: '예비군으로 인한 불참',
  },
  2,
)
assert.equal(noScheduleId.id, 'schedule-3-2')
assert.equal(noScheduleId.title, '-')
assert.equal(noScheduleId.attendanceStatus, 'excused')
assert.equal(noScheduleId.absenceReason, '예비군으로 인한 불참')

const missingStart = mapPortalEducationSchedule(
  {
    scheduleId: 1,
    sessionNo: 1,
    sessionLabel: '1차시',
    title: '필요와 욕구',
    content: '소비 계획을 세워 봅니다.',
  },
  0,
)
assert.equal(missingStart.id, '1')
assert.equal(missingStart.heldAt, '')
assert.equal(missingStart.sessionLabel, '1차시')
assert.equal(missingStart.title, '필요와 욕구')
assert.equal(missingStart.content, '소비 계획을 세워 봅니다.')

const assignmentOff = mapPortalEducationSchedule(
  {
    sessionNo: 1,
    startAt: '2026-04-03T10:00:00',
    title: '오리엔테이션',
    assignment: { enabled: false, status: 'NOT_SUBMITTED' },
  },
  0,
)
assert.equal(assignmentOff.assignment, undefined)

const assignmentOn = mapPortalEducationSchedule(
  {
    sessionNo: 2,
    startAt: '2026-04-04T10:00:00',
    title: '1차 교육',
    assignment: {
      enabled: true,
      submitStartAt: '2026-04-03T15:00:00',
      submitEndAt: '2026-04-10T18:00:00',
      status: 'FEEDBACK',
      canSubmit: false,
      canResubmit: true,
      responseStatus: 'REJECTED',
      formResponseId: 88,
      submissions: [
        { id: 501, kind: 'FILE', fileName: '과제.pdf' },
        { id: 2, kind: 'URL', url: 'https://example.com' },
      ],
    },
  },
  1,
)
assert.ok(assignmentOn.assignment)
assert.equal(assignmentOn.assignment.status, 'feedback')
assert.equal(assignmentOn.assignment.formResponseId, 88)
assert.equal(assignmentOn.assignment.responseStatus, 'REJECTED')
assert.equal(assignmentOn.assignment.files?.length, 2)
const assignmentSubmissions = assignmentOn.assignment.files ?? []
assert.equal(assignmentSubmissions[0]?.id, 'file-501')
assert.equal(assignmentSubmissions[1]?.id, 'url-2')
if (assignmentSubmissions[0]?.kind === 'file') {
  assert.equal(assignmentSubmissions[0].fileObjectId, 501)
}
if (assignmentSubmissions[1]?.kind === 'url') {
  assert.equal(assignmentSubmissions[1].url, 'https://example.com')
}
assert.equal(assignmentOn.assignment.canSubmit, false)
assert.equal(assignmentOn.assignment.canResubmit, true)

const assignmentApproved = mapPortalEducationSchedule(
  {
    sessionNo: 3,
    startAt: '2026-04-05T10:00:00',
    title: '2차 교육',
    assignment: {
      enabled: true,
      submitStartAt: '2026-04-03T15:00:00',
      submitEndAt: '2026-04-10T18:00:00',
      status: 'FEEDBACK',
      canSubmit: false,
      canResubmit: false,
      responseStatus: 'APPROVED',
      formResponseId: 99,
    },
  },
  2,
)
assert.ok(assignmentApproved.assignment)
assert.equal(assignmentApproved.assignment.status, 'feedback')
assert.equal(assignmentApproved.assignment.responseStatus, 'APPROVED')
assert.equal(assignmentApproved.assignment.canResubmit, false)
assert.equal(assignmentOff.assignment, undefined)
assert.ok(assignmentOn.assignment.periodLabel.includes('~'))

const scheduleLabel = mapPortalEducationSchedule(
  {
    sessionNo: 1,
    scheduleLabel: '세부 일정 01',
    scheduleName: '개회식',
    blockKind: 'EVENT',
    progressTimeLabel: '10:00 ~ 12:00',
    groupTimes: [{ startTime: '10:00', endTime: '12:00' }],
  },
  0,
)
assert.equal(scheduleLabel.scheduleLabel, '세부 일정 01')
assert.equal(scheduleLabel.title, '개회식')
assert.equal(scheduleLabel.progressTimeLabel, '10:00 ~ 12:00')

const titleFallback = mapPortalEducationSchedule({ startAt: '2026-01-01T00:00:00' }, 4)
assert.equal(titleFallback.sessionNumber, 5)
assert.equal(titleFallback.title, '-')

const curriculumSingleUnitName = mapPortalEducationSchedule(
  {
    sessionNo: 1,
    title: '공통 교육 예정 2',
    unitName: '필요와 욕구',
    sessionLabel: '1차시',
  },
  0,
  { educationStructure: 'CURRICULUM', sessionRound: 'SINGLE' },
)
assert.equal(curriculumSingleUnitName.title, '필요와 욕구')

const curriculumMultiSession = mapPortalEducationSchedule(
  {
    sessionNo: 1,
    title: '1',
    sessionLabel: '1회차',
  },
  0,
  { educationStructure: 'CURRICULUM', sessionRound: 'MULTI' },
)
assert.equal(curriculumMultiSession.title, '1차시')
assert.equal(curriculumMultiSession.rowLabel, '1회차')

const scheduleNameOverSlotTitle = mapPortalEducationSchedule(
  {
    sessionNo: 1,
    title: '공통 교육 예정 2',
    scheduleName: '개회식',
    scheduleLabel: '세부 일정 01',
  },
  0,
  { educationStructure: 'SCHEDULE', sessionRound: 'SINGLE' },
)
assert.equal(scheduleNameOverSlotTitle.title, '개회식')
assert.equal(scheduleNameOverSlotTitle.rowLabel, '개회식')

const emptyCommonInfo = mapPortalEducationSchedule(
  {
    sessionNo: 2,
    title: '공통 교육 예정 2',
    locationName: '서울',
  },
  1,
  { educationStructure: 'CURRICULUM', sessionRound: 'SINGLE' },
)
assert.equal(emptyCommonInfo.title, '-')

const unregisteredSchedule = mapPortalEducationSchedule(
  {
    scheduleId: null,
    sessionNo: 1,
    sessionLabel: '1차시',
    title: '도입',
  },
  0,
)
assert.equal(unregisteredSchedule.scheduleId, null)
assert.equal('scheduleId' in unregisteredSchedule, true)

const availableActions = mapPortalEducationSchedule(
  {
    scheduleId: 9,
    attendanceStatus: 'ABSENT',
    availableActions: ['VIEW_ATTENDANCE'],
    assignmentStatus: 'ASSIGNED',
    classLabel: '1학년 3반',
  },
  0,
)
assert.deepEqual(availableActions.availableActions, ['VIEW_ATTENDANCE'])
assert.equal(availableActions.assignmentStatus, 'ASSIGNED')
assert.equal(availableActions.classLabel, '1학년 3반')
assert.equal(availableActions.attendanceStatus, 'absent')

const ujatPortalSchedule = mapPortalEducationSchedule(
  {
    scheduleId: 187580,
    startAt: '2026-10-31T15:00:00Z',
    assignmentStatus: 'ASSIGNED',
    classLabel: '1학년 2반',
    organizationName: '대전초록중학교',
    locationName: null,
    attendanceStatus: 'LATE',
  },
  0,
)
assert.equal(ujatPortalSchedule.scheduleId, 187580)
assert.equal(ujatPortalSchedule.heldAt, '2026-10-31T15:00:00Z')
assert.equal(ujatPortalSchedule.assignmentStatus, 'ASSIGNED')
assert.equal(ujatPortalSchedule.classLabel, '1학년 2반')
assert.equal(ujatPortalSchedule.organizationName, '대전초록중학교')
assert.equal(ujatPortalSchedule.locationName, '대전초록중학교')
assert.equal(ujatPortalSchedule.attendanceStatus, 'late')

const unassignedPortalSchedule = mapPortalEducationSchedule(
  {
    scheduleId: 187581,
    assignmentStatus: 'UNASSIGNED',
    classLabel: null,
    organizationName: null,
    locationName: null,
  },
  0,
)
assert.equal(unassignedPortalSchedule.assignmentStatus, 'UNASSIGNED')
assert.equal(unassignedPortalSchedule.classLabel, undefined)
assert.equal(unassignedPortalSchedule.locationName, undefined)

const teamLeader = mapPortalEducationSchedule(
  { scheduleId: 20, teamRole: 'LEADER', teamName: '글로벌챌린저스' },
  0,
)
assert.deepEqual(teamLeader.team, { roleLabel: '팀장', teamName: '글로벌챌린저스' })

const teamIndividual = mapPortalEducationSchedule(
  { scheduleId: 21, teamRole: 'INDIVIDUAL', teamName: null },
  0,
)
assert.deepEqual(teamIndividual.team, { roleLabel: '개인' })

const nonTeamProgram = mapPortalEducationSchedule({ scheduleId: 22, teamName: '무시' }, 0)
assert.equal(nonTeamProgram.team, undefined)

const volunteerAssignment = mapPortalEducationSchedule(
  { scheduleId: 23, assignment: { enabled: true, canSubmit: true } },
  0,
  { applicationType: 'VOLUNTEER' },
)
assert.equal(volunteerAssignment.assignment, undefined)

const instructorAssignment = mapPortalEducationSchedule(
  { scheduleId: 24, assignment: { enabled: true, canSubmit: true } },
  0,
  { applicationType: 'INSTRUCTOR' },
)
assert.equal(instructorAssignment.assignment, undefined)

// 일정형 사전교육 블록 — scheduleName 없이 title·blockKind 만 오는 응답 (신청 1694714 형태)
const preEducationMeta = {
  educationStructure: 'SCHEDULE',
  sessionRound: 'MULTI',
  applicationType: 'INDIVIDUAL',
} as const
const preEducation = mapPortalEducationSchedule(
  {
    scheduleId: 187614,
    title: '사전 교육',
    startAt: '2026-10-31T12:20:00Z',
    endAt: '2026-10-31T12:22:00Z',
    attendanceStatus: 'PRESENT',
    blockKind: 'PRE_EDUCATION',
    teamRole: null,
    teamName: null,
  },
  0,
  preEducationMeta,
)
assert.equal(preEducation.rowLabel, '사전교육')
assert.equal(preEducation.progressTimeLabel, '2026년 10월 31일(토) 21:20 ~ 21:22')
assert.equal(preEducation.team, undefined)

const subBlock = mapPortalEducationSchedule(
  {
    scheduleId: 187612,
    title: '개인일정',
    startAt: '2026-10-31T12:25:00Z',
    endAt: '2026-10-31T12:30:00Z',
    blockKind: 'SUB',
  },
  1,
  preEducationMeta,
)
// scheduleName 이 없으면 title(CMS 일정명)을 라벨로 쓴다
assert.equal(subBlock.rowLabel, '개인일정')

const singleCurriculumDay = mapPortalEducationSchedule(
  {
    scheduleId: 187626,
    title: '공통 교육 예정 1',
    sessionLabel: '1차시',
    content: '1차시만 매칭된 레거시 본문',
    curriculumSessions: [
      {
        sessionNo: 1,
        sessionLabel: '1차시',
        title: '1단원 나를 발견하는 진로 탐색',
        content: '1차시 내용',
      },
      {
        sessionNo: 2,
        sessionLabel: '2차시',
        title: '2단원 나를 보여주는 커리어 포트폴리오',
        content: '2차시 내용',
      },
    ],
  },
  0,
  { educationStructure: 'CURRICULUM', sessionRound: 'SINGLE' },
)
assert.equal(singleCurriculumDay.sessionLabel, '1차시')
assert.equal(singleCurriculumDay.content, '1차시만 매칭된 레거시 본문')
assert.equal(singleCurriculumDay.curriculumSessions?.length, 2)
assert.equal(singleCurriculumDay.curriculumSessions?.[1]?.sessionLabel, '2차시')

const omittedSessions = mapPortalEducationSchedule(
  { scheduleId: 1, sessionLabel: '1회차', content: '레거시' },
  0,
  { educationStructure: 'CURRICULUM', sessionRound: 'MULTI' },
)
assert.equal(omittedSessions.curriculumSessions, undefined)
assert.equal(omittedSessions.content, '레거시')

const emptySessions = mapPortalEducationSchedule(
  { scheduleId: 2, sessionLabel: '1차시', content: '폴백', curriculumSessions: [] },
  0,
)
assert.equal(emptySessions.curriculumSessions, undefined)

const preferenceRankLabel = mapPortalEducationSchedule(
  { scheduleId: 187703, preferenceRank: 1, startAt: '2026-11-13T15:07:00+09:00' },
  0,
)
assert.equal(preferenceRankLabel.rowLabel, '1지망')

const sessionLabelWinsOverRank = mapPortalEducationSchedule(
  {
    scheduleId: 187704,
    preferenceRank: 2,
    sessionLabel: '2차시',
    startAt: '2026-11-16T15:07:00+09:00',
  },
  0,
  { educationStructure: 'CURRICULUM' },
)
assert.equal(sessionLabelWinsOverRank.rowLabel, '2차시')

const ttOrgDay = mapPortalEducationSchedule(
  {
    scheduleId: 187703,
    sessionNo: 3,
    title: '공통 교육 예정 3',
    startAt: '2026-11-13T06:07:00Z',
    endAt: '2026-11-13T07:07:00Z',
    scheduleStatus: 'SCHEDULED',
    sessionLabel: '1지망',
    preferenceRank: 1,
    curriculumSessions: [
      { sessionNo: 1, sessionLabel: '1차시', title: '교육받은교사 테스트' },
      { sessionNo: 2, sessionLabel: '2차시', title: '교육받은교사 테스트2' },
    ],
  },
  0,
  {
    applicationType: 'ORGANIZATION',
    programType: 'TRAINED_TEACHER',
    educationStructure: 'CURRICULUM',
    sessionRound: 'SINGLE',
  },
)
assert.equal(ttOrgDay.rowLabel, '1지망')
assert.equal(ttOrgDay.title, '1지망')
// 차시 근거(groupTimes·희망 블록)가 없으면 `1차시`를 지어내지 않는다.
assert.equal(ttOrgDay.durationLabel, undefined)
assert.equal(ttOrgDay.preferenceRank, 1)
assert.equal(ttOrgDay.sessionNumber, 3)
assert.equal(ttOrgDay.operationalDayView, true)
assert.equal(ttOrgDay.curriculumSessions, undefined)
assert.equal(ttOrgDay.scheduleStatus, 'SCHEDULED')
assert.equal(ttOrgDay.progressTimeLabel, '2026년 11월 13일(금) 15:07 ~ 16:07')

const ttOrgRankOnly = mapPortalEducationSchedule(
  {
    scheduleId: 187704,
    sessionNo: 4,
    title: '공통 교육 예정 4',
    preferenceRank: 2,
    startAt: '2026-11-16T06:07:00Z',
  },
  6,
  { applicationType: 'ORGANIZATION', programType: 'TRAINED_TEACHER' },
)
assert.equal(ttOrgRankOnly.rowLabel, '2지망')

const ttOrgFromPreferredBlock = mapPortalEducationSchedule(
  {
    scheduleId: 187701,
    sessionNo: 1,
    startAt: '2026-04-17T00:00:00Z',
    endAt: '2026-04-17T03:30:00Z',
    preferenceRank: 3,
  },
  0,
  {
    applicationType: 'ORGANIZATION',
    programType: 'TRAINED_TEACHER',
    preferredScheduleBlocks: [
      { scheduleId: 187703, preferenceRank: 1, sessionTimes: [{ startTime: '15:07', endTime: '16:07' }] },
      {
        scheduleId: 187701,
        preferenceRank: 3,
        sessionCount: 1,
        sessionTimes: [
          { startTime: '09:00', endTime: '09:50' },
          { startTime: '10:00', endTime: '10:50' },
          { startTime: '11:40', endTime: '12:30' },
        ],
      },
    ],
  },
)
assert.equal(ttOrgFromPreferredBlock.durationLabel, '3차시')

const ttOrgSessionCountOnly = mapPortalEducationSchedule(
  { scheduleId: 187702, startAt: '2026-11-19T06:07:00Z' },
  0,
  {
    applicationType: 'ORGANIZATION',
    programType: 'TRAINED_TEACHER',
    preferredScheduleBlocks: [{ scheduleId: 187702, sessionCount: 2 }],
  },
)
assert.equal(ttOrgSessionCountOnly.durationLabel, '2차시')

const ttOrgGroupTimesWin = mapPortalEducationSchedule(
  {
    scheduleId: 187701,
    startAt: '2026-11-17T06:07:00Z',
    groupTimes: [{ startTime: '15:07', endTime: '16:07' }],
  },
  0,
  {
    applicationType: 'ORGANIZATION',
    programType: 'TRAINED_TEACHER',
    preferredScheduleBlocks: [{ scheduleId: 187701, sessionCount: 4 }],
  },
)
assert.equal(ttOrgGroupTimesWin.durationLabel, '1차시')

// 1사1교 배정 교육 일정(USER-FUNC-0207) — 같은 scheduleId 희망 블록 교시로 「N~(N+1)교시 (N차시)」
const companySchoolBlocks = [
  {
    scheduleId: 501,
    sessionCount: 2,
    sessionTimes: [
      { sessionIndex: 1, classPeriod: '2', startTime: '09:50', endTime: '10:30' },
      { sessionIndex: 2, classPeriod: '3', startTime: '10:40', endTime: '11:20' },
    ],
  },
]
const companySchoolRow = mapPortalEducationSchedule(
  { scheduleId: 501, sessionNo: 1, startAt: '2026-11-12T09:50:00+09:00', endAt: '2026-11-12T11:20:00+09:00' },
  0,
  { applicationType: 'ORGANIZATION', programType: 'COMPANY_SCHOOL', preferredScheduleBlocks: companySchoolBlocks },
)
assert.equal(companySchoolRow.rowLabel, '2~3교시 (2차시)')
// 1사1교 카드 날짜 — 기획 형식 「YYYY.MM.DD(요일)」
assert.equal(companySchoolRow.dateLabelOverride, '2026.11.12(목)')
// 다른 유형은 날짜 override 없음(플랫폼 공통 날짜 표기)
assert.equal(withId.dateLabelOverride, undefined)
const companySchoolUnmatched = mapPortalEducationSchedule(
  { scheduleId: 999, sessionNo: 1, startAt: '2026-11-12T09:50:00+09:00' },
  0,
  { applicationType: 'ORGANIZATION', programType: 'COMPANY_SCHOOL', preferredScheduleBlocks: companySchoolBlocks },
)
assert.notEqual(companySchoolUnmatched.rowLabel, '2~3교시 (2차시)')

console.log('map-from-portal.selfcheck: ok')
