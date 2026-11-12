import assert from 'node:assert/strict'
import { resolveTeacherPreferredSchedules } from './teacher-preferred-schedules.ts'

const fromBlocks = resolveTeacherPreferredSchedules({
  preferredScheduleBlocks: [
    {
      date: '2026-04-20',
      sessionTimes: [{ classPeriod: '1교시', startTime: '09:30', endTime: '12:20' }],
    },
  ],
})
assert.equal(fromBlocks.length, 1)
assert.ok(fromBlocks[0]!.value.includes('2026년'))
assert.ok(fromBlocks[0]!.label.includes('1'))

const fromOpaque = resolveTeacherPreferredSchedules({
  preferredScheduleOptionValues: ['schedule:186626'],
  program: {
    educationScheduleLines: [],
    eventSchedules: [
      {
        scheduleLabel: '교육 일정 1',
        name: '특별 JOB담',
        dateLabel: '2026년 04월 20일(월) | 1차시',
        scheduleId: 186626,
      },
    ],
  },
})
assert.equal(fromOpaque.length, 1)
assert.ok(fromOpaque[0]!.value.includes('2026년'))

const matchedBlock = resolveTeacherPreferredSchedules({
  preferredScheduleBlocks: [
    {
      date: '2026-04-20',
      sessionTimes: [{ classPeriod: '1교시', startTime: '09:30', endTime: '12:20' }],
      scheduleId: 186626,
      startAt: '2026-04-20T00:30:00Z',
      endAt: '2026-04-20T03:20:00Z',
      round: 1,
      label: '교육 일정 1',
      scheduleStatus: 'MATCHED',
    },
  ],
})
assert.equal(matchedBlock[0]!.scheduleId, 186626)
assert.equal(matchedBlock[0]!.scheduleStatus, 'MATCHED')
assert.equal(matchedBlock[0]!.statusLabel, undefined)

const unmatchedLegacyLine = resolveTeacherPreferredSchedules({
  preferredScheduleOptionValues: ['line:0'],
  preserveLegacyLineTokens: true,
  program: {
    educationScheduleLines: ['2026년 04월 20일(월) | 1차시'],
    eventSchedules: [],
  },
})
assert.equal(unmatchedLegacyLine[0]!.value, 'line:0')
assert.equal(unmatchedLegacyLine[0]!.scheduleStatus, 'UNMATCHED')

const pipedLineCards = resolveTeacherPreferredSchedules({
  preferredScheduleOptionValues: ['line:1'],
  program: {
    educationScheduleLines: [
      '26년 4월 20일(월) 9:30 ~ 12:20 | 26년 4월 27일(일) 13:00 ~ 15:50',
    ],
    eventSchedules: [],
  },
})
assert.equal(pipedLineCards.length, 1)
assert.equal(pipedLineCards[0]!.value, '2026년 4월 27일(월) 13:00 ~ 15:50')

const inactiveBlock = resolveTeacherPreferredSchedules({
  preferredScheduleBlocks: [
    {
      date: '2026-04-20',
      sessionTimes: [{ classPeriod: '1교시', startTime: '09:30', endTime: '12:20' }],
      scheduleStatus: 'INACTIVE_OR_DELETED',
    },
  ],
})
assert.equal(inactiveBlock[0]!.statusLabel, '비활성 또는 삭제된 일정')

// 교육받은교사 — 시안 「날짜 | N차시」 + 「K차시: M교시 | 시간」
const trainedTeacherCards = resolveTeacherPreferredSchedules({
  trainedTeacherSessionDetail: true,
  preferredScheduleBlocks: [
    {
      preferenceRank: 1,
      date: '2026-04-20',
      sessionCount: 1,
      sessionTimes: [{ sessionIndex: 1, classPeriod: '1', startTime: '09:00', endTime: '09:40' }],
    },
    {
      preferenceRank: 2,
      date: '2026-04-27',
      sessionCount: 2,
      sessionTimes: [
        { sessionIndex: 1, classPeriod: '1', startTime: '09:00', endTime: '09:40' },
        { sessionIndex: 2, classPeriod: '2교시', startTime: '09:50', endTime: '10:30' },
      ],
    },
  ],
})
assert.equal(trainedTeacherCards[0]!.value, '2026년 4월 20일(월) | 1차시')
assert.deepEqual(trainedTeacherCards[0]!.sessionLines, ['1차시: 1교시 | 09:00 ~ 09:40'])
assert.equal(trainedTeacherCards[1]!.value, '2026년 4월 27일(월) | 2차시')
assert.deepEqual(trainedTeacherCards[1]!.sessionLines, [
  '1차시: 1교시 | 09:00 ~ 09:40',
  '2차시: 2교시 | 09:50 ~ 10:30',
])
// 다른 유형은 기존 표기 그대로
assert.equal(fromBlocks[0]!.sessionLines, undefined)

console.log('teacher-preferred-schedules.selfcheck: ok')
