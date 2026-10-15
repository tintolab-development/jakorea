import assert from 'node:assert/strict'
import { resolveTeacherPreferredSchedules } from './teacher-preferred-schedules.ts'

const fromBlocks = resolveTeacherPreferredSchedules({
  preferredScheduleBlocks: [
    {
      date: '2026-04-20',
      sessionTimes: [{ classPeriod: '1차시', startTime: '09:30', endTime: '12:20' }],
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

console.log('teacher-preferred-schedules.selfcheck: ok')
