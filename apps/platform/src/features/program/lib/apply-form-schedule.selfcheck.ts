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
  buildEnabledDatesFromEducationScheduleLines,
  buildTrainedTeachersFixedScheduleOptions,
  readInstitutionAllowedSchedulePeriods,
  readInstitutionApplyScheduleDateBounds,
  readInstitutionFixedScheduleChoiceItems,
  readRuntimeFixedScheduleChoiceItems,
  resolveInstitutionAllowedScheduleEnabledDates,
  normalizeInstitutionFixedScheduleAnswerTokens,
  remapInstitutionSchedulePreviewSlotIds,
  shouldUseInstitutionAllowedSchedulePeriodDates,
  resolveApplyPreferredScheduleMaxBlocks,
  resolveApplyPreferredScheduleMaxBlocksFromFixedOptions,
  hasMissingRequiredBottomConsent,
  hasPreferredScheduleDateOutsideRuntime,
  isRuntimeScheduleNotConfigured,
  readRuntimeScheduleConfig,
  resolveRuntimeScheduleDateBounds,
  resolveRuntimeScheduleEnabledDates,
  shouldShowApplyPreferredSchedule,
  shouldShowApplySchedulePeriodDateOnlyPreferred,
  shouldShowApplyScheduleParagraph,
} from './apply-form-schedule.ts'
import { readApplyScheduleMetaFromProgram } from './apply-form-schedule-meta.ts'
import { PROGRAM_APPLICATION_FORM_INSTITUTION_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-institution-draft'
import { PROGRAM_PARTICIPANT_APPLICATION_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-individual-draft'
import {
  findIncompletePreferredScheduleMessage,
  toFixedScheduleOptionAnswerValue,
} from './preferred-schedule-blocks.ts'

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
      educationScheduleLines: ['26년 4월 20일(월) 9:30 ~ 12:20', '26년 4월 27일(월) 13:00 ~ 15:50'],
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
    true
  )
  assert.equal(
    shouldShowApplyScheduleParagraph({
      educationStructure: 'curriculum',
      sessionRound: 'single',
      educationScheduleMode: 'date',
      educationScheduleLines: ['26년 4월 20일(월) 09:30 ~ 12:20'],
    }),
    false
  )

  assert.equal(
    shouldShowApplyScheduleParagraph({
      educationStructure: 'curriculum',
      sessionRound: 'single',
      educationScheduleMode: 'date',
      educationScheduleLines: ['26년 4월 20일(월) 9:30 ~ 12:20', '26년 4월 27일(월) 13:00 ~ 15:50'],
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
    1
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
    resolveApplyPreferredScheduleMaxBlocksFromFixedOptions([{ id: 'schedule:187125' }]),
    1
  )
  assert.equal(
    resolveApplyPreferredScheduleMaxBlocksFromFixedOptions([
      { id: 'schedule:187125' },
      { id: 'schedule:187126' },
    ]),
    2
  )
  assert.equal(
    resolveApplyPreferredScheduleMaxBlocksFromFixedOptions([
      { id: 'schedule:187125' },
      { id: 'schedule:187125' },
      { id: 'schedule:187126' },
    ]),
    2
  )

  assert.equal(
    shouldShowApplyPreferredSchedule({
      educationStructure: 'curriculum',
      sessionRound: 'single',
      educationScheduleMode: 'date',
      educationScheduleLines: ['26년 4월 20일(월) 9:30 ~ 12:20', '26년 4월 27일(월) 13:00 ~ 15:50'],
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
    educationScheduleLines: ['26년 4월 20일(월) 9:30 ~ 12:20', '26년 4월 27일(월) 13:00 ~ 15:50'],
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
    true
  )
  assert.equal(
    shouldShowApplyScheduleParagraph({
      ...scheduleSingleDateTwoDays,
      educationScheduleLines: ['26년 4월 20일(월) 09:30 ~ 12:20'],
    }),
    false
  )
  assert.equal(
    shouldShowApplyScheduleParagraph({
      ...scheduleSingleDateTwoDays,
      educationScheduleLines: [
        '26년 10월 30일(금) 13:30 ~ 15:30 | 26년 10월 30일(금) 09:30 ~ 11:30',
      ],
    }),
    true
  )

  const individualScheduleTwoDays = {
    educationStructure: 'schedule' as const,
    sessionRound: 'single' as const,
    educationScheduleMode: 'date' as const,
    educationScheduleLines: ['26년 4월 20일(월) 9:30 ~ 12:20', '26년 4월 27일(월) 13:00 ~ 15:50'],
  }
  assert.equal(shouldShowApplyScheduleParagraph(individualScheduleTwoDays), true)
  assert.equal(shouldShowApplyPreferredSchedule(individualScheduleTwoDays), false)
}

function testTrainedTeacherPeriodDateBounds() {
  const runtime = {
    scheduleInputMode: 'date_time_requests',
    allowedSchedulePeriods: [
      { startDate: '2026-11-08', endDate: '2026-11-12' },
      { startDate: '2026-11-25', endDate: '2026-11-30' },
    ],
    minScheduleDate: '2026-11-08',
    maxScheduleDate: '2026-12-05',
  }
  assert.deepEqual(readRuntimeScheduleConfig(runtime), {
    scheduleInputMode: 'date_time_requests',
    allowedSchedulePeriods: [
      { startDate: '2026-11-08', endDate: '2026-11-12' },
      { startDate: '2026-11-25', endDate: '2026-11-30' },
    ],
    minScheduleDate: '2026-11-08',
    maxScheduleDate: '2026-12-05',
  })
  assert.deepEqual(resolveRuntimeScheduleDateBounds(runtime), {
    minScheduleDate: '2026-11-08',
    maxScheduleDate: '2026-12-05'
  })
  const enabledDates = resolveRuntimeScheduleEnabledDates(runtime, true)
  assert.equal(enabledDates?.has('2026-11-08'), true)
  assert.equal(enabledDates?.has('2026-11-17'), false)
  assert.equal(enabledDates?.has('2026-11-25'), true)
  assert.equal(hasPreferredScheduleDateOutsideRuntime([{ date: '2026-11-10' }], runtime), false)
  assert.equal(hasPreferredScheduleDateOutsideRuntime([{ date: '2026-11-17' }], runtime), true)
  assert.equal(hasPreferredScheduleDateOutsideRuntime([{ date: '2026-11-26' }], runtime), false)
  assert.equal(hasPreferredScheduleDateOutsideRuntime([{ date: '2026-08-12' }], runtime), true)
  assert.equal(hasPreferredScheduleDateOutsideRuntime([{ date: '2026-12-06' }], runtime), true)
  assert.equal(
    hasPreferredScheduleDateOutsideRuntime([{ date: '2026-11-08' }, { date: '2026-11-30' }], runtime),
    false,
  )

  const unconfiguredRuntime = { scheduleInputMode: 'date_time_requests' }
  assert.equal(isRuntimeScheduleNotConfigured(unconfiguredRuntime), true)
  assert.equal(resolveRuntimeScheduleEnabledDates(unconfiguredRuntime, true)?.size, 0)
  assert.equal(hasPreferredScheduleDateOutsideRuntime([{ date: '2026-11-10' }], unconfiguredRuntime), true)

  const consentDraft = {
    schemaVersion: 1,
    formSettings: {},
    paragraphs: [
      {
        id: 'program-application-trained-teachers-seed-personal-info',
        kind: 'single_item',
        variant: 'vertical_table',
        showBottomConsent: true,
        bottomConsent: null,
      },
      {
        id: 'program-application-trained-teachers-seed-third-party',
        kind: 'single_item',
        variant: 'vertical_table',
        showBottomConsent: true,
        bottomConsent: 'agree',
      },
    ],
  } as never
  assert.equal(hasMissingRequiredBottomConsent(consentDraft), true)

  assert.equal(
    findIncompletePreferredScheduleMessage([
      { date: '2026-11-10', classPeriod: '1', startTime: '14:00', endTime: '03:03' },
    ]),
    '교육 종료 시간은 시작 시간 이후로 입력해 주세요.'
  )
  assert.equal(
    findIncompletePreferredScheduleMessage([
      { date: '2026-11-10', classPeriod: '1', startTime: '03:00', endTime: '00:05' },
    ]),
    '교육 종료 시간은 시작 시간 이후로 입력해 주세요.'
  )
}

testTrainedTeacherPeriodDateBounds()

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
    educationScheduleLines: ['26년 4월 20일(일) 9:30 ~ 12:20', '26년 4월 27일(월) 13:00 ~ 15:50'],
  }),
  false
)

assert.equal(
  isInstitutionApplyScheduleChoiceParagraphId(
    PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.scheduleChoice
  ),
  true
)
assert.equal(
  isInstitutionApplyScheduleChoiceParagraphId(PROGRAM_PARTICIPANT_APPLICATION_IDS.scheduleChoice),
  false
)

assert.equal(
  readApplyScheduleInputMode({ scheduleInputMode: 'date_time_requests' }),
  'date_time_requests'
)
assert.equal(
  readApplyScheduleInputMode({ scheduleInputMode: 'fixed_schedule_options' }),
  'fixed_schedule_options'
)
assert.equal(readApplyScheduleInputMode({}), null)

assert.deepEqual(
  [
    ...buildEnabledDatesFromEducationScheduleLines([
      '26년 4월 20일(월) 09:30 ~ 12:20 | 26년 4월 20일(월) 13:00 ~ 15:50',
      '2026년 4월 27일(월) 09:30 ~ 12:20 | 2회차',
    ]),
  ],
  ['2026-04-20', '2026-04-27']
)
assert.deepEqual(
  buildTrainedTeachersFixedScheduleOptions([
    '26년 4월 20일(월) 09:30 ~ 12:20 | 26년 4월 20일(월) 13:00 ~ 15:50',
    '2026년 4월 27일(월) 09:30 ~ 12:20 | 2회차',
  ]).map(option => ({
    value: option.value,
    date: option.date,
    startTime: option.startTime,
    endTime: option.endTime,
    session: option.session,
  })),
  [
    {
      value: 'line:0',
      date: '2026-04-20',
      startTime: '09:30',
      endTime: '12:20',
      session: undefined,
    },
    {
      value: 'line:1',
      date: '2026-04-20',
      startTime: '13:00',
      endTime: '15:50',
      session: undefined,
    },
    { value: 'line:2', date: '2026-04-27', startTime: '09:30', endTime: '12:20', session: '2회차' },
  ]
)

const boundsFromRuntime = readInstitutionApplyScheduleDateBounds({
  minScheduleDate: '2026-10-20',
  maxScheduleDate: '2026-10-31',
})
assert.equal(boundsFromRuntime.minScheduleDate, '2026-10-20')
assert.equal(boundsFromRuntime.maxScheduleDate, '2026-10-31')

const boundsPreferParagraph = readInstitutionApplyScheduleDateBounds(
  { minScheduleDate: '2026-10-01', maxScheduleDate: '2026-11-30' },
  { runtimeMinDate: '2026-10-20', runtimeMaxDate: '2026-10-31' }
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
  { items: [] }
)
assert.ok(fixedItems)
assert.equal(fixedItems![0]?.id, 'line:1')
assert.equal(fixedItems![1]?.id, 'schedule:42')

const runtimeFixedItems = readRuntimeFixedScheduleChoiceItems(
  {
    scheduleInputMode: 'fixed_schedule_options',
    scheduleOptions: [{ id: '187123', value: 'schedule:187123', label: '교육 일정' }],
  },
  { items: [] }
)
assert.deepEqual(runtimeFixedItems, [{ id: 'schedule:187123', label: '교육 일정' }])
assert.equal(
  readRuntimeFixedScheduleChoiceItems(
    { scheduleInputMode: 'fixed_schedule_options', scheduleOptions: [{ scheduleId: 187123 }] },
    { items: [] }
  ),
  null
)
assert.equal(
  readRuntimeFixedScheduleChoiceItems(
    { scheduleInputMode: 'fixed_schedule_options', scheduleOptions: [] },
    { items: [] }
  ),
  null
)
assert.equal(
  readRuntimeFixedScheduleChoiceItems(
    { scheduleInputMode: 'fixed_schedule_options' },
    { items: [{ id: 'line:0', label: 'stale seed' }] }
  ),
  null
)
assert.deepEqual(
  toFixedScheduleOptionAnswerValue([
    { scheduleOptionId: 'schedule:187123' },
    { scheduleOptionId: 'schedule:187123' },
    { scheduleOptionId: 'schedule:187124' },
  ]),
  ['schedule:187123', 'schedule:187124']
)

const normalized = normalizeInstitutionFixedScheduleAnswerTokens(
  ['line:1'],
  {
    scheduleOptions: [
      { id: 'line:1', label: '10/20', scheduleId: 99 },
      { id: 'line:2', option_value: 'schedule:186626', label: '운영' },
    ],
  },
  { items: [] }
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
  { items: [{ id: 'line:2', label: '26년 11월 9일(월) 9:30 ~ 11:30' }] }
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
  }
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
  null
)
assert.ok(periods)
assert.equal(periods!.length, 2)
assert.equal(shouldUseInstitutionAllowedSchedulePeriodDates(periods), true)
assert.equal(shouldUseInstitutionAllowedSchedulePeriodDates([]), false)

assert.equal(resolveInstitutionAllowedScheduleEnabledDates(null, false), null)
assert.equal(resolveInstitutionAllowedScheduleEnabledDates(null, true)?.size, 0)
assert.equal(resolveInstitutionAllowedScheduleEnabledDates([], true)?.size, 0)
assert.equal(resolveInstitutionAllowedScheduleEnabledDates(periods, true)?.has('2026-10-28'), true)

const enabled = buildEnabledDatesFromAllowedSchedulePeriods(periods!)
assert.equal(enabled.has('2026-10-28'), true)
assert.equal(enabled.has('2026-10-30'), false)
assert.equal(enabled.has('2026-11-11'), true)

assert.deepEqual(
  remapInstitutionSchedulePreviewSlotIds([
    'institution-schedule-slot-1',
    'institution-schedule-slot-2',
  ]),
  ['line:0', 'line:1']
)
assert.deepEqual(
  remapInstitutionSchedulePreviewSlotIds(['line:0', 'institution-schedule-slot-1', 'line:1']),
  ['line:0', 'line:1']
)

const keepLineTokens = normalizeInstitutionFixedScheduleAnswerTokens(
  ['line:0', 'line:1'],
  {
    scheduleInputMode: 'fixed_schedule_options',
    scheduleOptions: [
      { id: 'line:0', label: '26년 10월 30일(금) 13:30 ~ 15:30', scheduleId: null },
      { id: 'line:1', label: '26년 10월 30일(금) 9:30 ~ 11:30', scheduleId: null },
    ],
  },
  {
    items: [
      { id: 'institution-schedule-slot-1', label: 'seed 1' },
      { id: 'institution-schedule-slot-2', label: 'seed 2' },
    ],
  }
)
assert.deepEqual(keepLineTokens, ['line:0', 'line:1'])

const remappedPreview = normalizeInstitutionFixedScheduleAnswerTokens(
  ['institution-schedule-slot-1', 'institution-schedule-slot-2'],
  {
    scheduleInputMode: 'fixed_schedule_options',
    scheduleOptions: [
      { id: 'line:0', label: '26년 10월 30일(금) 13:30 ~ 15:30', scheduleId: null },
      { id: 'line:1', label: '26년 10월 30일(금) 9:30 ~ 11:30', scheduleId: null },
    ],
  },
  { items: [{ id: 'institution-schedule-slot-1', label: 'seed 1' }] }
)
assert.deepEqual(remappedPreview, ['line:0', 'line:1'])

function testPreEducationExcludedFromCurriculumChartSessionCount() {
  const scheduleLine = '26년 11월 2일(월) 10:00 ~ 12:00'
  const meta = readApplyScheduleMetaFromProgram({
    sessionRound: 'single',
    sessions: [
      { sessionLabel: '사전 교육', title: '사전 교육', description: '' },
      { sessionLabel: '1차시', title: '필요와 욕구', description: '' },
      { sessionLabel: '2차시', title: '저축 목표', description: '' },
    ],
  })
  assert.equal(meta.curriculumChartSessionCount, 2)

  const items = readInstitutionFixedScheduleChoiceItems(
    null,
    {},
    {
      educationScheduleLines: [scheduleLine],
      educationStructure: 'curriculum',
      sessionRound: 'single',
      educationScheduleMode: 'date',
      curriculumChartSessionCount: meta.curriculumChartSessionCount,
      curriculumSessions: meta.curriculumSessions,
    }
  )
  assert.equal(items?.length, 1)
  assert.equal(items?.[0]?.label, `${scheduleLine} | 2차시`)
}

testPreEducationExcludedFromCurriculumChartSessionCount()

console.log('apply-form-schedule.selfcheck: ok')
