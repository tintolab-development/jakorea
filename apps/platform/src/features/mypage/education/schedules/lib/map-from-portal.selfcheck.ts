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
assert.equal(withId.attendanceStatus, 'present')
assert.equal(withId.assignment, undefined)

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
assert.equal(assignmentOn.assignment.files?.length, 2)
const assignmentSubmissions = assignmentOn.assignment.files ?? []
assert.equal(assignmentSubmissions[0]?.id, 'file-1')
assert.equal(assignmentSubmissions[1]?.id, 'url-2')
if (assignmentSubmissions[0]?.kind === 'file') {
  assert.equal(assignmentSubmissions[0].fileObjectId, 501)
}
if (assignmentSubmissions[1]?.kind === 'url') {
  assert.equal(assignmentSubmissions[1].url, 'https://example.com')
}
assert.equal(assignmentOn.assignment.canSubmit, false)
assert.equal(assignmentOn.assignment.canResubmit, true)
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

const teamLeader = mapPortalEducationSchedule(
  { scheduleId: 20, teamRole: 'LEADER', teamName: '글로벌챌린저스' },
  0,
)
assert.deepEqual(teamLeader.team, { roleLabel: '팀장', teamName: '글로벌챌린저스' })

const teamIndividual = mapPortalEducationSchedule(
  { scheduleId: 21, teamRole: 'INDIVIDUAL', teamName: null },
  0,
)
assert.deepEqual(teamIndividual.team, { roleLabel: '개인', teamName: '-' })

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

console.log('map-from-portal.selfcheck: ok')
