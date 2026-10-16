/**
 * 일반 프로그램 신청 폼 — 일정 단락 노출 (CMS 브리지와 동일).
 * 실행: pnpm --filter platform test
 */

import assert from 'node:assert/strict'
import {
  applyScheduleVisibilityFieldsFromRuntimeContext,
  countUniqueEducationScheduleCalendarDays,
  isInstitutionApplyScheduleChoiceParagraphId,
  readApplyScheduleInputMode,
  buildEnabledDatesFromAllowedSchedulePeriods,
  readInstitutionAllowedSchedulePeriods,
  readInstitutionApplyScheduleDateBounds,
  readInstitutionFixedScheduleChoiceItems,
  normalizeInstitutionFixedScheduleAnswerTokens,
  shouldUseInstitutionAllowedSchedulePeriodDates,
  resolveApplyPreferredScheduleMaxBlocks,
  shouldShowApplyPreferredSchedule,
  shouldShowApplySchedulePeriodDateOnlyPreferred,
  shouldShowApplyScheduleParagraph,
} from './apply-form-schedule.ts'
import { PROGRAM_APPLICATION_FORM_INSTITUTION_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-institution-draft'
import { PROGRAM_PARTICIPANT_APPLICATION_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-individual-draft'

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
    resolveApplyPreferredScheduleMaxBlocks({
      educationStructure: 'curriculum',
      sessionRound: 'single',
      educationScheduleMode: 'period',
      educationScheduleLines: [],
      maxPreferredScheduleCount: 1,
    }),
    10
  )
  assert.equal(
    resolveApplyPreferredScheduleMaxBlocks(
      {
        educationStructure: 'curriculum',
        sessionRound: 'single',
        educationScheduleMode: 'period',
        educationScheduleLines: [],
        maxPreferredScheduleCount: 4,
      },
      { maxScheduleCount: 4 }
    ),
    4
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

  assert.equal(
    shouldShowApplySchedulePeriodDateOnlyPreferred({
      educationStructure: 'schedule',
      sessionRound: 'single',
      educationScheduleMode: 'period',
    }),
    true
  )
  assert.equal(
    shouldShowApplySchedulePeriodDateOnlyPreferred({
      educationStructure: 'curriculum',
      sessionRound: 'single',
      educationScheduleMode: 'period',
    }),
    false
  )

  const scheduleSingleDateTwoDays = {
    educationStructure: 'schedule' as const,
    sessionRound: 'single' as const,
    educationScheduleMode: 'date' as const,
    educationScheduleLines: [
      '26년 4월 20일(월) 9:30 ~ 12:20',
      '26년 4월 27일(월) 13:00 ~ 15:50',
    ],
  }
  assert.equal(shouldShowApplyScheduleParagraph(scheduleSingleDateTwoDays), true)
  assert.equal(shouldShowApplyPreferredSchedule(scheduleSingleDateTwoDays), false)
  assert.equal(
    shouldShowApplyScheduleParagraph({
      ...scheduleSingleDateTwoDays,
      educationScheduleLines: [
        '26년 4월 20일(월) 09:30 ~ 12:20',
        '26년 4월 20일(월) 13:00 ~ 15:50',
      ],
    }),
    false
  )

  const individualScheduleTwoDays = {
    educationStructure: 'schedule' as const,
    sessionRound: 'single' as const,
    educationScheduleMode: 'date' as const,
    educationScheduleLines: [
      '26년 4월 20일(월) 9:30 ~ 12:20',
      '26년 4월 27일(월) 13:00 ~ 15:50',
    ],
  }
  assert.equal(shouldShowApplyScheduleParagraph(individualScheduleTwoDays), true)
  assert.equal(shouldShowApplyPreferredSchedule(individualScheduleTwoDays), false)
}

testUniqueCalendarDays()
testScheduleParagraphVisibility()

const runtimeScheduleMulti = applyScheduleVisibilityFieldsFromRuntimeContext({
  educationStructure: 'SCHEDULE',
  sessionRound: 'MULTI',
  scheduleMode: 'FIXED_DATE',
})
assert.ok(runtimeScheduleMulti)
assert.equal(
  shouldShowApplyScheduleParagraph({
    ...runtimeScheduleMulti,
    educationScheduleLines: [
      '26년 4월 20일(일) 9:30 ~ 12:20',
      '26년 4월 27일(월) 13:00 ~ 15:50',
    ],
  }),
  false
)

assert.equal(
  isInstitutionApplyScheduleChoiceParagraphId(
    PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.scheduleChoice,
  ),
  true,
)
assert.equal(
  isInstitutionApplyScheduleChoiceParagraphId(
    PROGRAM_PARTICIPANT_APPLICATION_IDS.scheduleChoice,
  ),
  false,
)

assert.equal(readApplyScheduleInputMode({ scheduleInputMode: 'date_time_requests' }), 'date_time_requests')
assert.equal(
  readApplyScheduleInputMode({ scheduleInputMode: 'fixed_schedule_options' }),
  'fixed_schedule_options',
)
assert.equal(readApplyScheduleInputMode({}), null)

const boundsFromRuntime = readInstitutionApplyScheduleDateBounds({
  minScheduleDate: '2026-10-20',
  maxScheduleDate: '2026-10-31',
})
assert.equal(boundsFromRuntime.minScheduleDate, '2026-10-20')
assert.equal(boundsFromRuntime.maxScheduleDate, '2026-10-31')

const boundsPreferParagraph = readInstitutionApplyScheduleDateBounds(
  { minScheduleDate: '2026-10-01', maxScheduleDate: '2026-11-30' },
  { runtimeMinDate: '2026-10-20', runtimeMaxDate: '2026-10-31' },
)
assert.equal(boundsPreferParagraph.minScheduleDate, '2026-10-20')
assert.equal(boundsPreferParagraph.maxScheduleDate, '2026-10-31')

const boundsNull = readInstitutionApplyScheduleDateBounds({
  minScheduleDate: null,
  maxScheduleDate: null,
})
assert.equal(boundsNull.minScheduleDate, null)
assert.equal(boundsNull.maxScheduleDate, null)

const fixedItems = readInstitutionFixedScheduleChoiceItems(
  {
    scheduleOptions: [
      { id: 'line:1', label: '26년 10월 20일(화) 13:30 ~ 16:00' },
      { scheduleId: 42, label: '운영 일정' },
    ],
  },
  { items: [] },
)
assert.ok(fixedItems)
assert.equal(fixedItems![0]?.id, 'line:1')
assert.equal(fixedItems![1]?.id, 'schedule:42')

const normalized = normalizeInstitutionFixedScheduleAnswerTokens(
  ['line:1'],
  {
    scheduleOptions: [
      { id: 'line:1', label: '10/20', scheduleId: 99 },
      { id: 'line:2', option_value: 'schedule:186626', label: '운영' },
    ],
  },
  { items: [] },
)
assert.deepEqual(normalized, ['schedule:99'])

const keepOriginalLineIndex = readInstitutionFixedScheduleChoiceItems(null, {
  items: [{ id: 'line:1', label: '10/20' }],
})
assert.ok(keepOriginalLineIndex)
assert.equal(keepOriginalLineIndex![0]?.id, 'line:1')

const runtimeOverridesStaleSeed = readInstitutionFixedScheduleChoiceItems(
  {
    scheduleInputMode: 'fixed_schedule_options',
    scheduleOptions: [
      { id: 'line:0', label: '26년 10월 26일(월) 10:00 ~ 12:00' },
      { id: 'line:1', label: '26년 11월 2일(월) 13:30 ~ 16:00' },
      { id: 'line:2', label: '26년 11월 9일(월) 9:30 ~ 11:30' },
    ],
  },
  { items: [{ id: 'line:2', label: '26년 11월 9일(월) 9:30 ~ 11:30' }] },
)
assert.equal(runtimeOverridesStaleSeed?.length, 3)

const educationLinesFallback = readInstitutionFixedScheduleChoiceItems(
  { scheduleInputMode: 'fixed_schedule_options', scheduleOptions: [] },
  { items: [{ id: 'line:2', label: 'only seed' }] },
  {
    educationScheduleLines: [
      '26년 10월 26일(월) 10:00 ~ 12:00',
      '26년 11월 2일(월) 13:30 ~ 16:00',
      '26년 11월 9일(월) 9:30 ~ 11:30',
    ],
  },
)
assert.equal(educationLinesFallback?.length, 3)
assert.equal(educationLinesFallback![0]?.id, 'line:0')

assert.equal(readInstitutionAllowedSchedulePeriods(null, null), null)

const periods = readInstitutionAllowedSchedulePeriods(
  {
    allowedSchedulePeriods: [
      { startDate: '2026-10-28', endDate: '2026-10-29' },
      { startDate: '2026-11-11', endDate: '2026-11-12' },
    ],
  },
  null,
)
assert.ok(periods)
assert.equal(periods!.length, 2)
assert.equal(shouldUseInstitutionAllowedSchedulePeriodDates(periods), true)
assert.equal(shouldUseInstitutionAllowedSchedulePeriodDates([]), false)

const enabled = buildEnabledDatesFromAllowedSchedulePeriods(periods!)
assert.equal(enabled.has('2026-10-28'), true)
assert.equal(enabled.has('2026-10-30'), false)
assert.equal(enabled.has('2026-11-11'), true)

console.log('apply-form-schedule.selfcheck: ok')
