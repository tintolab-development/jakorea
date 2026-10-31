import assert from 'node:assert/strict'
import { PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-volunteer-draft'
import { resolveMypagePreferredScheduleLines } from './mypage-preferred-schedule-lines.ts'

const volunteerFromActivitySchedule = resolveMypagePreferredScheduleLines({
  applicationType: 'VOLUNTEER',
  answers: {
    [PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.activitySchedule]: {
      selectedSlotIds: ['schedule:186626'],
      selectedLabels: ['강서초등학교 : 2026년 4월 20일 (09:30 ~ 12:00)'],
      summary: '강서초등학교 : 2026년 4월 20일 (09:30 ~ 12:00)',
    },
  },
  program: {
    educationScheduleLines: [],
    eventSchedules: [
      {
        scheduleLabel: '일정 1',
        name: '봉사 일정',
        dateLabel: '2026년 4월 20일(월) 9:30 ~ 12:20',
        scheduleId: 186626,
        startAt: '2026-04-20T00:30:00Z',
        endAt: '2026-04-20T03:20:00Z',
      },
    ],
  },
})
assert.equal(volunteerFromActivitySchedule.length, 1)
assert.ok(volunteerFromActivitySchedule[0]?.includes('2026년'))
assert.ok(volunteerFromActivitySchedule[0]?.includes('강서초등학교'))

const instructorIdsOnly = resolveMypagePreferredScheduleLines({
  applicationType: 'INSTRUCTOR',
  answers: {
    'program-instructor-application-seed-available-schedule': {
      selectedSlotIds: ['schedule:186659:education-period:0'],
    },
  },
  program: {
    educationScheduleLines: [],
    eventSchedules: [
      {
        scheduleLabel: '일정 1',
        name: '기간 지정 강의',
        dateLabel: '2026년 10월 28일(수) ~ 2026년 11월 12일(목)',
        scheduleId: 186659,
        startAt: '2026-10-28T00:30:00Z',
        endAt: '2026-11-12T03:20:00Z',
      },
    ],
  },
})
assert.equal(instructorIdsOnly.length, 1)
assert.ok(instructorIdsOnly[0]?.includes('10월 28일'))

const volunteerFromSummaryOnly = resolveMypagePreferredScheduleLines({
  applicationType: 'VOLUNTEER',
  answers: {
    [PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.activitySchedule]: {
      selectedSlotIds: ['interview-slot:1'],
      summary: '26년 10월 28일(수) 09:30 ~ 12:00',
    },
  },
})
assert.equal(volunteerFromSummaryOnly.length, 1)
assert.ok(volunteerFromSummaryOnly[0]?.includes('10월'))

const withoutEmptyCards = resolveMypagePreferredScheduleLines({
  preferredEducationScheduleLabel: '진행 희망 교육 일정 1 -\n-\n2026년 4월 20일(월) 09:30 ~ 12:00',
})
assert.deepEqual(withoutEmptyCards, ['2026년 4월 20일(월) 09:30 ~ 12:00'])

console.log('mypage-preferred-schedule-lines.selfcheck: ok')
