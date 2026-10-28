import assert from 'node:assert/strict'
import { resolveGeminiProgramOperatingPeriodLabel } from './gemini-program-period-label.ts'

assert.equal(
  resolveGeminiProgramOperatingPeriodLabel({
    detailCase: 'gemini',
    operatingPeriodLabel: '2026년 9월 1일 ~ 2026년 9월 30일',
    recruitmentPeriodLabel: '2026년 9월 1일 ~ 2026년 9월 30일',
    geminiTrainingRequestPeriodLabel: '2026년 11월 2일(월) ~ 2026년 11월 30일(월)',
    educationScheduleLines: [],
    eventSchedules: [],
  }),
  '2026년 11월 2일(월) ~ 2026년 11월 30일(월)',
)

assert.equal(
  resolveGeminiProgramOperatingPeriodLabel({
    detailCase: 'gemini',
    operatingPeriodLabel: '2026년 9월 1일 ~ 2026년 9월 30일',
    recruitmentPeriodLabel: '2026년 9월 1일 ~ 2026년 9월 30일',
    geminiTrainingRequestPeriodLabel: '2026년 11월 2일(월) ~ 2026년 11월 30일(월)',
    educationScheduleLines: ['2026년 11월 10일(화) 10:00 ~ 12:00'],
    eventSchedules: [],
  }),
  '2026년 11월 10일(화) 10:00 ~ 12:00',
)

assert.equal(
  resolveGeminiProgramOperatingPeriodLabel({
    detailCase: 'general',
    operatingPeriodLabel: '2026년 3월 1일 ~ 2026년 3월 31일',
    recruitmentPeriodLabel: '2026년 2월 1일 ~ 2026년 2월 28일',
    educationScheduleLines: [],
    eventSchedules: [],
  }),
  '2026년 3월 1일 ~ 2026년 3월 31일',
)

console.log('gemini-program-period-label.selfcheck: ok')
