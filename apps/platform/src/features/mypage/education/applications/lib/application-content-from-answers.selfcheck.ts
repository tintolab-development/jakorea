import assert from 'node:assert/strict'
import {
  formatInterviewAtLabel,
  isOpaqueScheduleOptionToken,
  resolveApplicationContentFromAnswers,
  resolvePreferredEducationScheduleDisplayLabel,
  resolvePreferredScheduleLabelsFromAnswers,
} from './application-content-from-answers.ts'

const participant = resolveApplicationContentFromAnswers({
  'program-participant-application-seed-self-intro': '자기소개입니다.',
  'program-participant-application-seed-schedule': ['2026년 04월 20일(월) 9:30 ~ 12:20'],
})
assert.equal(participant.selfIntroMotivation, '자기소개입니다.')
assert.equal(participant.preferredEducationScheduleLabel, '2026년 4월 20일(월) 09:30 ~ 12:20')

const handoffShortKeys = resolveApplicationContentFromAnswers({
  selfIntro: '지원 동기입니다.',
  scheduleChoice: '2026년 3월 첫째 주 평일',
})
assert.equal(handoffShortKeys.selfIntroMotivation, '지원 동기입니다.')
assert.equal(handoffShortKeys.preferredEducationScheduleLabel, '2026년 3월 첫째 주 평일')

const volunteer = resolveApplicationContentFromAnswers({
  'program-volunteer-application-seed-free-text-items': {
    items: [{ id: 'intro', bodyText: '봉사 자기소개' }],
  },
  preferredScheduleBlocks: [
    {
      date: '2026-04-20',
      sessionTimes: [{ startTime: '09:30', endTime: '12:20' }],
    },
  ],
})
assert.equal(volunteer.selfIntroMotivation, '봉사 자기소개')
assert.ok(volunteer.preferredEducationScheduleLabel?.includes('2026년'))
assert.ok(volunteer.preferredEducationScheduleLabel?.includes('09:30') || volunteer.preferredEducationScheduleLabel?.includes('9:30'))

const interview = formatInterviewAtLabel('2026-03-15T09:00:00+09:00')
assert.equal(interview, '2026년 3월 15일(일) 09:00')

assert.equal(isOpaqueScheduleOptionToken('schedule:186626'), true)
assert.equal(
  isOpaqueScheduleOptionToken('schedule:186659:education-period:0'),
  true,
)
assert.equal(
  isOpaqueScheduleOptionToken('schedule:186659:organization-application:42:education-period:1'),
  true,
)
assert.equal(isOpaqueScheduleOptionToken('line:0'), true)
assert.equal(isOpaqueScheduleOptionToken('2026년 04월 20일(월) 9:30 ~ 12:20'), false)

const opaqueOnly = resolveApplicationContentFromAnswers({
  scheduleChoice: 'schedule:186626',
})
assert.equal(opaqueOnly.preferredEducationScheduleLabel, undefined)
assert.deepEqual(opaqueOnly.preferredScheduleOptionValues, ['schedule:186626'])

const resolved = resolvePreferredEducationScheduleDisplayLabel({
  preferredScheduleOptionValues: ['schedule:186626'],
  schedules: [
    {
      scheduleId: 186626,
      startAt: '2026-04-20T00:30:00Z',
      endAt: '2026-04-20T03:20:00Z',
      scheduleName: '특별 JOB담',
    },
  ],
})
assert.ok(resolved?.includes('2026년 4월 20일(월)'))
assert.ok(resolved?.includes('특별 JOB담'))

const lineResolved = resolvePreferredEducationScheduleDisplayLabel({
  preferredScheduleOptionValues: ['line:1'],
  educationScheduleLines: ['첫째 날 | 2차시', '2026년 04월 20일(월) 9:30 ~ 12:20 | 2차시'],
})
assert.equal(lineResolved, '2026년 4월 20일(월) 09:30 ~ 12:20 | 2차시')

const pipedLine = '26년 4월 20일(월) 9:30 ~ 12:20 | 26년 4월 27일(일) 13:00 ~ 15:50'
const pipedFirst = resolvePreferredEducationScheduleDisplayLabel({
  preferredScheduleOptionValues: ['line:0'],
  educationScheduleLines: [pipedLine],
})
assert.equal(pipedFirst, '2026년 4월 20일(월) 09:30 ~ 12:20')
assert.equal(pipedFirst?.includes('4월 27일'), false)

const pipedSecond = resolvePreferredEducationScheduleDisplayLabel({
  preferredScheduleOptionValues: ['line:1'],
  educationScheduleLines: [pipedLine],
})
assert.equal(pipedSecond, '2026년 4월 27일(월) 13:00 ~ 15:50')

const pipedBoth = resolvePreferredScheduleLabelsFromAnswers({
  preferredScheduleOptionValues: ['line:0', 'line:1'],
  educationScheduleLines: [`${pipedLine} | 2차시`],
})
assert.deepEqual(pipedBoth, [
  '2026년 4월 20일(월) 09:30 ~ 12:20 | 2차시',
  '2026년 4월 27일(월) 13:00 ~ 15:50 | 2차시',
])

const fromSelectedLabels = resolveApplicationContentFromAnswers({
  'program-instructor-application-seed-available-schedule': {
    selectedSlotIds: ['schedule:186659:education-period:0'],
    selectedLabels: ['26년 10월 28일(수) ~ 26년 11월 12일(목)'],
  },
})
assert.equal(
  fromSelectedLabels.preferredEducationScheduleLabel,
  '2026년 10월 28일(수) ~ 2026년 11월 12일(목)',
)

const educationPeriodResolved = resolvePreferredScheduleLabelsFromAnswers({
  preferredScheduleOptionValues: ['schedule:186659:education-period:0'],
  schedules: [
    {
      scheduleId: 186659,
      startAt: '2026-10-28T00:30:00Z',
      endAt: '2026-11-12T03:20:00Z',
      scheduleName: '기간 지정 강의',
    },
  ],
})
assert.equal(educationPeriodResolved.length, 1)
assert.ok(educationPeriodResolved[0]?.includes('2026년'))
assert.ok(educationPeriodResolved[0]?.includes('기간 지정 강의'))

const multilineDisplay = resolveApplicationContentFromAnswers({
  scheduleChoice: '26년 10월 28일(수) ~ 26년 11월 12일(목)\n26년 11월 25일(수) ~ 26년 12월 11일(금)',
})
assert.ok(multilineDisplay.preferredEducationScheduleLabel?.includes('11월 25일'))

const dateOnlyMappedToFormOption = resolvePreferredEducationScheduleDisplayLabel({
  preferredEducationScheduleLabel: '2026. 11. 03(화)',
  educationScheduleLines: [
    '2026. 11. 03(화) 10:00 ~ 12:00 | 1차시',
    '2026. 11. 27(금) 10:38 ~ 11:38 | 2차시',
  ],
})
assert.equal(dateOnlyMappedToFormOption, '2026년 11월 3일(화) 10:00 ~ 12:00 | 1차시')

const dateOnlyKeepsStoredWithoutLines = resolvePreferredEducationScheduleDisplayLabel({
  preferredEducationScheduleLabel: '2026. 11. 03(화)',
})
assert.ok(dateOnlyKeepsStoredWithoutLines?.includes('11월'))
assert.equal(dateOnlyKeepsStoredWithoutLines?.includes('10:00'), false)

console.log('application-content-from-answers.selfcheck: ok')
