import assert from 'node:assert/strict'
import {
  formatAssignmentEducationUnitLabel,
  formatInstructorEducationScheduleLine,
  formatInstructorEducationUnitLabel,
  formatLectureReportCardTimeSubtitle,
  isCanonicalPreEducationSchedule,
  readInstructorEducationScheduleFields,
} from './instructor-education-schedule-display.ts'

// CASE 1. 사전교육 + 본교육 2회차 (회차별 커리큘럼 2차시)
assert.equal(
  formatInstructorEducationUnitLabel({
    scheduleRole: 'PRE_EDUCATION',
    sessionNo: null,
  }),
  '사전교육',
)
assert.equal(
  formatInstructorEducationUnitLabel({
    sessionNo: 1,
    curriculumSessionCount: 2,
  }),
  '1회차 (2차시)',
)
assert.equal(
  formatInstructorEducationUnitLabel({
    sessionNo: 2,
    curriculumSessionCount: 2,
  }),
  '2회차 (2차시)',
)
assert.equal(
  formatLectureReportCardTimeSubtitle({
    timeRange: '15:00~15:10',
    scheduleRole: 'PRE_EDUCATION',
    sessionNo: null,
  }),
  '15:00~15:10 | 사전교육',
)
assert.equal(
  formatLectureReportCardTimeSubtitle({
    timeRange: '15:05~15:10',
    sessionNo: 1,
    curriculumSessionCount: 2,
  }),
  '15:05~15:10 | 1회차 | 2차시',
)
assert.equal(
  formatLectureReportCardTimeSubtitle({
    timeRange: '15:15~15:20',
    sessionNo: 2,
    curriculumSessionCount: 2,
  }),
  '15:15~15:20 | 2회차 | 2차시',
)

// CASE 2. 사전교육 없음 — 본교육 회차 원천 유지
assert.equal(formatInstructorEducationUnitLabel({ sessionNo: 1 }), '1회차')
assert.equal(formatInstructorEducationUnitLabel({ sessionNo: 2 }), '2회차')
assert.equal(
  isCanonicalPreEducationSchedule({ sessionNo: null, scheduleName: null }),
  false,
)

// CASE 3. 본교육 5회차, 회차별 차시 독립
assert.equal(
  formatInstructorEducationUnitLabel({ sessionNo: 1, curriculumSessionCount: 1 }),
  '1회차 (1차시)',
)
assert.equal(
  formatInstructorEducationUnitLabel({ sessionNo: 3, curriculumSessionCount: 4 }),
  '3회차 (4차시)',
)
assert.equal(formatInstructorEducationUnitLabel({ sessionNo: 5 }), '5회차')

// CASE 4. 차시 정보 누락 — 임의 차시 금지
assert.equal(formatInstructorEducationUnitLabel({ sessionNo: 2 }), '2회차')
assert.notEqual(formatInstructorEducationUnitLabel({ sessionNo: 2 }), '2회차 (2차시)')

// CASE 5. sessionNo=null
assert.equal(
  formatInstructorEducationUnitLabel({
    sessionNo: null,
    scheduleRole: 'PRE_EDUCATION',
  }),
  '사전교육',
)
assert.equal(
  formatInstructorEducationUnitLabel({
    sessionNo: null,
    educationSlotKey: 'general-pre-education:1',
  }),
  '사전교육',
)
assert.equal(
  formatInstructorEducationUnitLabel({ sessionNo: null, scheduleKind: 'PRE_EDUCATION' }),
  '사전교육',
)
assert.equal(formatInstructorEducationUnitLabel({ sessionNo: null }), '')
assert.equal(formatAssignmentEducationUnitLabel({ sessionNo: null }, false), '-')
assert.equal(
  isCanonicalPreEducationSchedule({ sessionNo: null, scheduleName: '사전교육' }),
  false,
)
assert.equal(
  formatInstructorEducationUnitLabel({ sessionNo: null, scheduleName: '사전 교육' }),
  '사전교육',
)

// CASE 6. 회차/차시 동일 숫자여도 출처가 다름
assert.equal(
  formatInstructorEducationUnitLabel({ sessionNo: 2, curriculumSessionCount: 2 }),
  '2회차 (2차시)',
)
assert.equal(formatInstructorEducationUnitLabel({ sessionNo: 2 }), '2회차')
assert.equal(
  formatInstructorEducationUnitLabel({ curriculumSessionCount: 2 }),
  '2차시',
)

// CASE 7. UTC 06:05Z → 한국 15:05
assert.equal(
  formatInstructorEducationScheduleLine(
    {
      startAt: '2026-11-06T06:05:00.000Z',
      endAt: '2026-11-06T06:10:00.000Z',
      sessionNo: 1,
    },
    false,
  ),
  '2026년 11월 6일(금) 15:05~15:10 | 1회차',
)
assert.equal(
  formatInstructorEducationScheduleLine(
    {
      startAt: '2026-11-06T06:00:00.000Z',
      endAt: '2026-11-06T06:10:00.000Z',
      scheduleRole: 'PRE_EDUCATION',
      sessionNo: null,
    },
    false,
  ),
  '2026년 11월 6일(금) 15:00~15:10 | 사전교육',
)

// 일정형 복수 회차: 일정명 우선. 사전교육 canonical은 일정명보다 우선.
assert.equal(
  formatAssignmentEducationUnitLabel(
    { sessionNo: 2, scheduleName: '세부 일정 01' },
    true,
  ),
  '세부 일정 01',
)
assert.equal(
  formatAssignmentEducationUnitLabel(
    { sessionNo: 2, scheduleName: null },
    true,
  ),
  '-',
)
assert.equal(
  formatAssignmentEducationUnitLabel(
    { sessionNo: 2, scheduleName: '세부 일정 01', scheduleRole: 'PRE_EDUCATION' },
    true,
  ),
  '사전교육',
)

// sessionNo를 차시로 쓰지 않음
assert.notEqual(formatInstructorEducationUnitLabel({ sessionNo: 1 }), '1차시')
assert.notEqual(formatInstructorEducationUnitLabel({ sessionNo: 2 }), '2차시')

// loose-read: 있는 필드만
assert.deepEqual(
  readInstructorEducationScheduleFields({
    sessionNo: 1,
    scheduleRole: 'EDUCATION',
    educationSlotKey: 'general-common-line:1',
    curriculumSessionCount: 2,
  }),
  {
    scheduleRole: 'EDUCATION',
    educationSlotKey: 'general-common-line:1',
    scheduleKind: null,
    sessionNo: 1,
    scheduleName: null,
    curriculumSessionCount: 2,
  },
)
assert.equal(
  readInstructorEducationScheduleFields({ sessionNo: 3 }).curriculumSessionCount,
  null,
)
assert.equal(
  readInstructorEducationScheduleFields({
    curriculumSessions: [{}, {}],
  }).curriculumSessionCount,
  2,
)

console.log('instructor-education-schedule-display.selfcheck ok')
