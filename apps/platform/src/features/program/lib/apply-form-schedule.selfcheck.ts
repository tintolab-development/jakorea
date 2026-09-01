/**
 * 일반 프로그램 신청 폼 — 일정 단락 노출 (CMS 브리지와 동일).
 * 실행: pnpm --filter platform test
 */

import assert from 'node:assert/strict'
import {
  countUniqueEducationScheduleCalendarDays,
  shouldShowApplyPreferredSchedule,
  shouldShowApplyScheduleParagraph,
} from './apply-form-schedule.ts'

function testUniqueCalendarDays() {
  assert.equal(
    countUniqueEducationScheduleCalendarDays([
      '26년 4월 20일(월) 09:30 ~ 12:20',
      '26년 4월 20일(월) 13:00 ~ 15:50',
    ]),
    1
  )
  assert.equal(
    countUniqueEducationScheduleCalendarDays([
      '2026년 4월 20일(월) 9:30 ~ 12:20',
      '2026년 4월 27일(월) 13:00 ~ 15:50',
    ]),
    2
  )
  assert.equal(
    countUniqueEducationScheduleCalendarDays(['26년 4월 20일(월) ~ 26년 4월 27일(월)']),
    1
  )
  assert.equal(countUniqueEducationScheduleCalendarDays([]), 0)
}

function testScheduleParagraphVisibility() {
  assert.equal(
    shouldShowApplyScheduleParagraph({
      educationStructure: 'schedule',
      sessionRound: 'multi',
      educationScheduleMode: 'date',
      educationScheduleLines: [
        '26년 4월 20일(월) 9:30 ~ 12:20',
        '26년 4월 27일(월) 13:00 ~ 15:50',
      ],
    }),
    false
  )

  assert.equal(
    shouldShowApplyScheduleParagraph({
      educationStructure: 'curriculum',
      sessionRound: 'single',
      educationScheduleMode: 'date',
      educationScheduleLines: [
        '26년 4월 20일(월) 09:30 ~ 12:20',
        '26년 4월 20일(월) 13:00 ~ 15:50',
      ],
    }),
    false
  )

  assert.equal(
    shouldShowApplyScheduleParagraph({
      educationStructure: 'curriculum',
      sessionRound: 'single',
      educationScheduleMode: 'date',
      educationScheduleLines: [
        '26년 4월 20일(월) 9:30 ~ 12:20',
        '26년 4월 27일(월) 13:00 ~ 15:50',
      ],
    }),
    true
  )

  assert.equal(
    shouldShowApplyScheduleParagraph({
      educationStructure: 'curriculum',
      sessionRound: 'single',
      educationScheduleMode: 'period',
      educationScheduleLines: ['26년 4월 20일(월) ~ 26년 4월 27일(월)'],
    }),
    true
  )

  assert.equal(
    shouldShowApplyPreferredSchedule({
      educationStructure: 'curriculum',
      sessionRound: 'single',
      educationScheduleMode: 'period',
      educationScheduleLines: ['26년 4월 20일(월) ~ 26년 4월 27일(월)'],
    }),
    true
  )

  assert.equal(
    shouldShowApplyPreferredSchedule({
      educationStructure: 'curriculum',
      sessionRound: 'single',
      educationScheduleMode: 'date',
      educationScheduleLines: [
        '26년 4월 20일(월) 9:30 ~ 12:20',
        '26년 4월 27일(월) 13:00 ~ 15:50',
      ],
    }),
    false
  )
}

testUniqueCalendarDays()
testScheduleParagraphVisibility()
console.log('apply-form-schedule.selfcheck: ok')
