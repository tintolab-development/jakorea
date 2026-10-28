import assert from 'node:assert/strict'
import {
  asAssignmentDisplayText,
  displayAssignmentValueOrDash,
  formatAssignmentDistanceKm,
  formatAssignmentSessionLabel,
  formatAssignmentWaitingStatus,
  formatInstructorRole,
  groupAssignmentsByInstitution,
  supportsInstructorIndividualAssignment,
  supportsInstructorInstitutionAssignment,
} from './instructor-assignment-support.ts'

assert.equal(supportsInstructorInstitutionAssignment('GENERAL_ORGANIZATION'), true)
assert.equal(supportsInstructorInstitutionAssignment('GEMINI_TRAINING'), true)
assert.equal(supportsInstructorInstitutionAssignment('COMPANY_SCHOOL'), false)
assert.equal(supportsInstructorInstitutionAssignment('GENERAL_INDIVIDUAL'), false)
assert.equal(supportsInstructorInstitutionAssignment(undefined), false)

assert.equal(supportsInstructorIndividualAssignment('GENERAL_INDIVIDUAL'), true)
assert.equal(supportsInstructorIndividualAssignment(' general_individual '), true)
assert.equal(supportsInstructorIndividualAssignment('GENERAL_ORGANIZATION'), false)
assert.equal(supportsInstructorIndividualAssignment('COMPANY_SCHOOL'), false)
assert.equal(supportsInstructorIndividualAssignment('GEMINI_TRAINING'), false)
assert.equal(supportsInstructorIndividualAssignment(null), false)

assert.equal(asAssignmentDisplayText(12.4), '12.4')
assert.equal(asAssignmentDisplayText(' 서울 강서구 '), '서울 강서구')
assert.equal(asAssignmentDisplayText({ sido: '서울' }), '')
assert.equal(displayAssignmentValueOrDash(0), '0')
assert.equal(displayAssignmentValueOrDash(null), '-')
assert.equal(displayAssignmentValueOrDash(['강서구']), '-')

// 역할: BE GeminiPortalAssignmentSupport.instructorRole → LEAD / ASSISTANT / null (기획·CMS: 대표 강사·일반 강사)
assert.equal(formatInstructorRole('LEAD'), '대표 강사')
assert.equal(formatInstructorRole('MAIN'), '대표 강사')
assert.equal(formatInstructorRole('ASSISTANT'), '일반 강사')
assert.equal(formatInstructorRole(' assistant '), '일반 강사')
assert.equal(formatInstructorRole('GENERAL'), '일반 강사')
assert.equal(formatInstructorRole(null), '-')

// 거리: 서버 km 값 그대로 + 단위
assert.equal(formatAssignmentDistanceKm(12.4), '12.4 km')
assert.equal(formatAssignmentDistanceKm(0), '0 km')
assert.equal(formatAssignmentDistanceKm('3.25'), '3.25 km')
assert.equal(formatAssignmentDistanceKm(null), '-')

// 그룹 키 = organizationApplicationId + 역할 + 실제 배정 학년(grade). 개인형(orgAppId null) = 일정마다 한 행. 서버 순서 유지
const ids = (groups: Array<{ items: Array<{ assignmentId: number }> }>) =>
  groups.map(group => group.items.map(item => item.assignmentId))

// 같은 기관 신청, 대표(LEAD) vs 일반(ASSISTANT) → 역할이 달라 2행
assert.deepEqual(
  ids(
    groupAssignmentsByInstitution([
      { assignmentId: 1, organizationApplicationId: 7, scheduleId: 101, instructorRole: 'LEAD', grade: '3' },
      { assignmentId: 2, organizationApplicationId: 7, scheduleId: 102, instructorRole: 'ASSISTANT', grade: '3' },
    ]),
  ),
  [[1], [2]],
)
// 같은 기관 신청·역할·학년 일정 2건 → 1행 2줄
assert.deepEqual(
  ids(
    groupAssignmentsByInstitution([
      { assignmentId: 1, organizationApplicationId: 7, scheduleId: 101, instructorRole: 'LEAD', grade: '3' },
      { assignmentId: 2, organizationApplicationId: 7, scheduleId: 102, instructorRole: 'LEAD', grade: ' 3 ' },
    ]),
  ),
  [[1, 2]],
)
// 같은 역할, 다른 학년 → 2행 (requestedGrade는 그룹 키가 아니다)
assert.deepEqual(
  ids(
    groupAssignmentsByInstitution([
      { assignmentId: 1, organizationApplicationId: 7, scheduleId: 101, instructorRole: 'LEAD', grade: '2', requestedGrade: '3' },
      { assignmentId: 2, organizationApplicationId: 7, scheduleId: 102, instructorRole: 'LEAD', grade: '3', requestedGrade: '3' },
    ]),
  ),
  [[1], [2]],
)
// 기관명이 같아도 기관 신청(organizationApplicationId)이 다르면 다른 행
assert.deepEqual(
  ids(
    groupAssignmentsByInstitution([
      { assignmentId: 1, organizationApplicationId: 7, scheduleId: 101, instructorRole: 'LEAD', grade: '3' },
      { assignmentId: 2, organizationApplicationId: 8, scheduleId: 102, instructorRole: 'LEAD', grade: '3' },
    ]),
  ),
  [[1], [2]],
)
// 행 순서는 서버 응답에서 처음 나온 순서, 개인형(orgAppId null)은 일정(scheduleId)마다 1행
assert.deepEqual(
  ids(
    groupAssignmentsByInstitution([
      { assignmentId: 30, organizationApplicationId: 2, scheduleId: 1, instructorRole: 'LEAD', grade: null },
      { assignmentId: 10, organizationApplicationId: 1, scheduleId: 2, instructorRole: 'LEAD', grade: null },
      { assignmentId: 20, organizationApplicationId: 2, scheduleId: 3, instructorRole: 'LEAD', grade: null },
      { assignmentId: 40, organizationApplicationId: null, scheduleId: 4, instructorRole: 'LEAD', grade: null },
      { assignmentId: 50, organizationApplicationId: null, scheduleId: 5, instructorRole: 'LEAD', grade: null },
      { assignmentId: 60, organizationApplicationId: null, scheduleId: 6, instructorRole: 'ASSISTANT', grade: null },
    ]),
  ),
  [[30, 20], [10], [40], [50], [60]],
)
assert.deepEqual(groupAssignmentsByInstitution([]), [])

// 배정 대기 상태: 서버 status를 라벨로만 바꾼다(배정 불가 사유는 표시하지 않음)
assert.deepEqual(formatAssignmentWaitingStatus('WAITING'), {
  tone: 'waiting', label: '배정 대기', disabled: false,
})
assert.deepEqual(formatAssignmentWaitingStatus('UNAVAILABLE'), {
  tone: 'unavailable', label: '배정 불가', disabled: true,
})
assert.deepEqual(formatAssignmentWaitingStatus('CANCELLED'), {
  tone: 'cancelled', label: '배정 취소', disabled: false,
})

// 차시 자리: 일정형+복수 회차는 일정명, 그 외 N차시
assert.equal(formatAssignmentSessionLabel({ sessionNo: 2, scheduleName: '세부 일정 01' }, false), '2차시')
assert.equal(formatAssignmentSessionLabel({ sessionNo: null, scheduleName: '세부 일정 01' }, false), '-')
assert.equal(formatAssignmentSessionLabel({ sessionNo: 2, scheduleName: ' 세부 일정 01 ' }, true), '세부 일정 01')
assert.equal(formatAssignmentSessionLabel({ sessionNo: 2, scheduleName: null }, true), '-')

console.log('instructor-assignment-support.selfcheck: ok')
