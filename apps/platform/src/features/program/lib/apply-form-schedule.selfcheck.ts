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
  findMissingRequiredBottomConsentId,
  areTrainedTeachersScheduleRuntimeFieldsInSync,
  hasPreferredScheduleDateOutsideRuntime,
  isDateInAllowedSchedulePeriods,
  isRuntimeScheduleNotConfigured,
  isTrainedTeachersOrganizationPeriodDateRequests,
  readRuntimeScheduleConfig,
  resolveRuntimeScheduleDateBounds,
  resolveRuntimeScheduleEnabledDates,
  shouldShowApplyPreferredSchedule,
  shouldShowApplySchedulePeriodDateOnlyPreferred,
  shouldShowApplyScheduleParagraph,
  isApplyScheduleChoiceHiddenInSet,
  pickApplyScheduleChoiceParagraph,
  readApplyFixedScheduleChoiceIds,
  resolveApplyScheduleChoiceAnswerKey,
  resolveHiddenScheduleAutoSubmitIds,
  excludePreEducationScheduleChoices,
  shouldBlockApplyForEmptyFixedSchedule,
  shouldExcludePreEducationFromApplyFixedSchedule,
  APPLY_EMPTY_FIXED_SCHEDULE_ALERT_TITLE,
  APPLY_EMPTY_FIXED_SCHEDULE_ALERT_LINES,
  GEMINI_INSTITUTION_PREFERRED_SCHEDULE_BLOCK_COUNT,
  GEMINI_INSTITUTION_SESSION_COUNT_MAX,
  GEMINI_INSTITUTION_SESSION_COUNT_MIN,
  buildGeminiInstitutionSessionSelectOptions,
  geminiInstitutionPreferredScheduleMapOptions,
  padPreferredScheduleBlocks,
  readGeminiTrainingRequestDateBounds,
  hasPreferredScheduleDateOutsideBounds,
  hasPreferredScheduleDateOutsideEducationConstraint,
  resolveEducationScheduleApplyConstraint,
  filterItemsByScheduleDateBounds,
  filterGeminiInstructorSlotsByTrainingRequestPeriod,
  isGeminiTrainingRequestPeriodConfigured,
} from './apply-form-schedule.ts'
import { readApplyScheduleMetaFromProgram } from './apply-form-schedule-meta.ts'
import { PROGRAM_APPLICATION_FORM_INSTITUTION_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-institution-draft'
import { PROGRAM_PARTICIPANT_APPLICATION_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-individual-draft'
import {
  capFixedScheduleSelectedIds,
  findIncompletePreferredScheduleMessage,
  selectedFixedScheduleIdsFromDraftAnswer,
  toFixedScheduleOptionAnswerValue,
  toPortalPreferredScheduleBlocks,
} from './preferred-schedule-blocks.ts'
import { normalizeScheduleDisplayLabel } from '../../../shared/lib/format-display-date.ts'
import type { PortalSaveApplicationRequest } from '../api/application-types.ts'

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

  const emptyPeriodsWithBounds = {
    scheduleInputMode: 'date_time_requests',
    allowedSchedulePeriods: [],
    minScheduleDate: '2026-11-05',
    maxScheduleDate: '2026-11-11',
  }
  assert.equal(isRuntimeScheduleNotConfigured(emptyPeriodsWithBounds), true)
  assert.equal(resolveRuntimeScheduleEnabledDates(emptyPeriodsWithBounds, true)?.size, 0)
  assert.equal(
    hasPreferredScheduleDateOutsideRuntime([{ date: '2026-11-05' }], emptyPeriodsWithBounds),
    true
  )

  const trainedTeacherPeriodRuntime = {
    programType: 'TRAINED_TEACHER',
    applicationFlavor: 'ORGANIZATION',
    educationStructure: 'SCHEDULE',
    sessionRound: 'SINGLE',
    scheduleMode: 'PERIOD',
    scheduleInputMode: 'date_time_requests',
    scheduleOptions: [],
    allowedSchedulePeriods: [{ startDate: '2026-11-05', endDate: '2026-11-11' }],
    minScheduleDate: '2026-11-05',
    maxScheduleDate: '2026-11-11',
    maxScheduleCount: 3,
    maxSessionsPerDay: null,
  }
  const trainedTeacherPeriodParagraph = {
    id: 'program-application-trained-teachers-seed-preferred-schedule',
    runtimeInputMode: 'date_time_requests',
    runtimeAllowedSchedulePeriods: [{ startDate: '2026-11-05', endDate: '2026-11-11' }],
    runtimeMinDate: '2026-11-05',
    runtimeMaxDate: '2026-11-11',
  }
  assert.equal(
    isTrainedTeachersOrganizationPeriodDateRequests(trainedTeacherPeriodRuntime),
    true
  )
  assert.equal(
    areTrainedTeachersScheduleRuntimeFieldsInSync(
      trainedTeacherPeriodRuntime,
      trainedTeacherPeriodParagraph
    ),
    true
  )
  assert.equal(isRuntimeScheduleNotConfigured(trainedTeacherPeriodRuntime), false)
  assert.equal(
    isRuntimeScheduleNotConfigured(trainedTeacherPeriodRuntime, trainedTeacherPeriodParagraph),
    false
  )
  const trainedTeacherEnabledDates = resolveRuntimeScheduleEnabledDates(
    trainedTeacherPeriodRuntime,
    true,
    trainedTeacherPeriodParagraph
  )
  assert.equal(trainedTeacherEnabledDates?.has('2026-11-05'), true)
  assert.equal(trainedTeacherEnabledDates?.has('2026-11-11'), true)
  assert.equal(trainedTeacherEnabledDates?.has('2026-11-04'), false)
  assert.equal(trainedTeacherEnabledDates?.has('2026-11-12'), false)

  const discontinuousPeriods = [
    { startDate: '2026-11-05', endDate: '2026-11-07' },
    { startDate: '2026-11-10', endDate: '2026-11-11' },
  ]
  const discontinuousRuntime = {
    ...trainedTeacherPeriodRuntime,
    allowedSchedulePeriods: discontinuousPeriods,
    minScheduleDate: '2026-11-05',
    maxScheduleDate: '2026-11-11',
  }
  const discontinuousEnabled = resolveRuntimeScheduleEnabledDates(discontinuousRuntime, true)
  assert.equal(discontinuousEnabled?.has('2026-11-05'), true)
  assert.equal(discontinuousEnabled?.has('2026-11-07'), true)
  assert.equal(discontinuousEnabled?.has('2026-11-08'), false)
  assert.equal(discontinuousEnabled?.has('2026-11-09'), false)
  assert.equal(discontinuousEnabled?.has('2026-11-10'), true)
  assert.equal(discontinuousEnabled?.has('2026-11-11'), true)
  assert.equal(
    isDateInAllowedSchedulePeriods('2026-11-08', discontinuousPeriods),
    false
  )
  assert.equal(
    hasPreferredScheduleDateOutsideRuntime([{ date: '2026-11-08' }], discontinuousRuntime),
    true
  )
  assert.equal(
    hasPreferredScheduleDateOutsideRuntime([{ date: '2026-11-06' }], discontinuousRuntime),
    false
  )

  const mismatchedParagraph = {
    ...trainedTeacherPeriodParagraph,
    runtimeAllowedSchedulePeriods: [{ startDate: '2026-11-01', endDate: '2026-11-02' }],
  }
  assert.equal(
    areTrainedTeachersScheduleRuntimeFieldsInSync(
      trainedTeacherPeriodRuntime,
      mismatchedParagraph
    ),
    false
  )

  const emptyPeriodsFailClosed = {
    programType: 'TRAINED_TEACHER',
    applicationFlavor: 'ORGANIZATION',
    scheduleMode: 'PERIOD',
    scheduleInputMode: 'date_time_requests',
    scheduleOptions: [],
    allowedSchedulePeriods: [],
    minScheduleDate: null,
    maxScheduleDate: null,
  }
  assert.equal(
    isTrainedTeachersOrganizationPeriodDateRequests(emptyPeriodsFailClosed),
    true
  )
  assert.equal(isRuntimeScheduleNotConfigured(emptyPeriodsFailClosed), true)
  assert.equal(resolveRuntimeScheduleEnabledDates(emptyPeriodsFailClosed, true)?.size, 0)
  assert.equal(
    isDateInAllowedSchedulePeriods('2026-11-05', trainedTeacherPeriodRuntime.allowedSchedulePeriods),
    true
  )
  assert.equal(
    isDateInAllowedSchedulePeriods('2026-11-11', trainedTeacherPeriodRuntime.allowedSchedulePeriods),
    true
  )
  assert.equal(
    isDateInAllowedSchedulePeriods('2026-11-04', trainedTeacherPeriodRuntime.allowedSchedulePeriods),
    false
  )
  assert.equal(
    hasPreferredScheduleDateOutsideRuntime(
      [{ date: '2026-11-05' }],
      trainedTeacherPeriodRuntime,
      trainedTeacherPeriodParagraph
    ),
    false
  )
  assert.equal(
    hasPreferredScheduleDateOutsideRuntime(
      [{ date: '2026-11-12' }],
      trainedTeacherPeriodRuntime,
      trainedTeacherPeriodParagraph
    ),
    true
  )
  assert.deepEqual(resolveRuntimeScheduleDateBounds(trainedTeacherPeriodRuntime), {
    minScheduleDate: '2026-11-05',
    maxScheduleDate: '2026-11-11',
  })
  assert.equal(
    readRuntimeScheduleConfig(trainedTeacherPeriodRuntime).scheduleInputMode,
    'date_time_requests'
  )
  assert.deepEqual(trainedTeacherPeriodRuntime.scheduleOptions, [])

  const paragraphOnlyPeriods = {
    scheduleInputMode: 'date_time_requests',
  }
  assert.equal(isRuntimeScheduleNotConfigured(paragraphOnlyPeriods), true)
  assert.equal(
    isRuntimeScheduleNotConfigured(paragraphOnlyPeriods, trainedTeacherPeriodParagraph),
    false
  )
  assert.equal(
    resolveRuntimeScheduleEnabledDates(paragraphOnlyPeriods, true, trainedTeacherPeriodParagraph)?.has(
      '2026-11-05'
    ),
    true
  )

  const runtimeFilledParagraphEmpty = {
    scheduleInputMode: 'date_time_requests',
    allowedSchedulePeriods: [{ startDate: '2026-11-05', endDate: '2026-11-11' }],
    minScheduleDate: '2026-11-05',
    maxScheduleDate: '2026-11-11',
  }
  const emptyParagraph = {
    runtimeInputMode: 'date_time_requests',
    runtimeAllowedSchedulePeriods: [],
    runtimeMinDate: null,
    runtimeMaxDate: null,
  }
  assert.equal(
    isRuntimeScheduleNotConfigured(runtimeFilledParagraphEmpty, emptyParagraph),
    false
  )
  assert.equal(
    resolveRuntimeScheduleEnabledDates(
      runtimeFilledParagraphEmpty,
      true,
      emptyParagraph
    )?.has('2026-11-05'),
    true
  )

  const dateModeRuntime = {
    scheduleInputMode: 'fixed_schedule_options',
    scheduleMode: 'DATE',
    scheduleOptions: [],
    allowedSchedulePeriods: [],
    minScheduleDate: null,
    maxScheduleDate: null,
  }
  assert.equal(isRuntimeScheduleNotConfigured(dateModeRuntime), false)
  assert.equal(resolveRuntimeScheduleEnabledDates(dateModeRuntime, true)?.size ?? 0, 0)

  assert.deepEqual(
    toPortalPreferredScheduleBlocks(
      [{ date: '2026-11-05', classPeriod: '', startTime: '', endTime: '' }],
      { dateOnly: true }
    ).map(({ date, sessionTimes }) => ({ date, sessionTimes })),
    [{ date: '2026-11-05', sessionTimes: [] }]
  )
  assert.deepEqual(
    toPortalPreferredScheduleBlocks(
      [{ date: '2026-04-03', classPeriod: '1교시', startTime: '09:00', endTime: '10:00' }],
      { dateFieldsOnly: true }
    ),
    [{ preferenceRank: 1, date: '2026-04-03' }]
  )

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
assert.deepEqual(
  readRuntimeFixedScheduleChoiceItems(
    {
      scheduleInputMode: 'fixed_schedule_options',
      scheduleOptions: [
        { id: '901', value: 'schedule:901', label: '사전 교육' },
        { id: '187123', value: 'schedule:187123', label: '교육 일정' },
        { id: '902', value: 'schedule:902', label: '봉사자 사전교육' },
      ],
    },
    { items: [] }
  ),
  [
    { id: 'schedule:187123', label: '교육 일정' },
    { id: 'schedule:902', label: '봉사자 사전교육' },
  ]
)
assert.deepEqual(
  readRuntimeFixedScheduleChoiceItems(
    { scheduleInputMode: 'fixed_schedule_options', scheduleOptions: [{ scheduleId: 187123 }] },
    { items: [] }
  ),
  [{ id: 'schedule:187123', label: '187123' }]
)
assert.deepEqual(
  readRuntimeFixedScheduleChoiceItems(
    { scheduleInputMode: 'fixed_schedule_options', scheduleOptions: [] },
    { items: [] }
  ),
  []
)
assert.deepEqual(
  readRuntimeFixedScheduleChoiceItems(
    {
      scheduleInputMode: 'fixed_schedule_options',
      scheduleOptions: [
        {
          id: '201',
          value: '201',
          label: '2026-11-02 10:00~12:00',
          startAt: '2026-11-02T01:00:00.000Z',
          endAt: '2026-11-02T03:00:00.000Z',
        },
        {
          id: '202',
          value: '202',
          label: '2026-11-09 13:30~16:00',
          startAt: '2026-11-09T04:30:00.000Z',
          endAt: '2026-11-09T07:00:00.000Z',
        },
      ],
    },
    { items: [{ id: 'line:0', label: 'stale seed' }] }
  )?.map(item => item.id),
  ['201', '202']
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
assert.deepEqual(capFixedScheduleSelectedIds(['201', '202'], null), ['201', '202'])
assert.deepEqual(capFixedScheduleSelectedIds(['201', '202'], 1), ['201'])
assert.deepEqual(selectedFixedScheduleIdsFromDraftAnswer(['201', '201', '202']), ['201', '202'])
assert.deepEqual(selectedFixedScheduleIdsFromDraftAnswer([{ date: '2026-11-02' }]), [])

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
  // ① 모든 예정일 줄 = 커리큘럼 총 차시 (사전 교육 제외 2 → 접미사 노출)
  assert.equal(items?.[0]?.label, `${scheduleLine} | 2차시`)
}

testPreEducationExcludedFromCurriculumChartSessionCount()

function testHiddenScheduleAutoSubmitIds() {
  assert.deepEqual(
    resolveHiddenScheduleAutoSubmitIds({
      hidden: true,
      forcedHidden: false,
      choiceIds: ['line:0'],
    }),
    ['line:0'],
  )
  assert.deepEqual(
    resolveHiddenScheduleAutoSubmitIds({
      hidden: true,
      forcedHidden: true,
      choiceIds: ['line:0', 'line:1'],
    }),
    ['line:0', 'line:1'],
  )
  assert.equal(
    resolveHiddenScheduleAutoSubmitIds({
      hidden: false,
      forcedHidden: false,
      choiceIds: ['line:0'],
    }),
    null,
  )
  assert.equal(
    resolveHiddenScheduleAutoSubmitIds({
      hidden: true,
      forcedHidden: false,
      choiceIds: [],
    }),
    null,
  )
  assert.equal(
    resolveHiddenScheduleAutoSubmitIds({
      hidden: true,
      forcedHidden: false,
      choiceIds: ['line:0', 'line:1'],
    }),
    null,
  )
  assert.deepEqual(
    readApplyFixedScheduleChoiceIds({
      runtimeChoices: [{ id: 'schedule:12' }, { id: ' schedule:12 ' }, { id: '' }],
    }),
    ['schedule:12'],
  )

  const individualScheduleId = PROGRAM_PARTICIPANT_APPLICATION_IDS.scheduleChoice
  const formParagraph = {
    id: individualScheduleId,
    items: [{ id: 'line:0' }, { id: 'line:1' }],
  }
  const pickedFromForm = pickApplyScheduleChoiceParagraph(
    [{ id: 'program-participant-application-seed-personal-info' }],
    [formParagraph],
  )
  assert.equal((pickedFromForm as { id: string }).id, individualScheduleId)
  assert.equal(
    isApplyScheduleChoiceHiddenInSet(new Set([individualScheduleId]), undefined),
    true,
  )
  assert.equal(isApplyScheduleChoiceHiddenInSet(new Set(), undefined), false)
  assert.equal(
    resolveApplyScheduleChoiceAnswerKey('individual-general', undefined),
    individualScheduleId,
  )
  assert.equal(
    resolveApplyScheduleChoiceAnswerKey('institution-general', undefined),
    PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.scheduleChoice,
  )
  assert.equal(resolveApplyScheduleChoiceAnswerKey('individual-volunteer', undefined), '')
  assert.deepEqual(
    resolveHiddenScheduleAutoSubmitIds({
      hidden: isApplyScheduleChoiceHiddenInSet(new Set([individualScheduleId]), pickedFromForm),
      forcedHidden: true,
      choiceIds: readApplyFixedScheduleChoiceIds({
        paragraph: pickedFromForm,
        educationScheduleLines: [
          '26년 4월 20일(월) 9:30 ~ 12:20',
          '26년 4월 27일(월) 13:00 ~ 15:50',
        ],
        program: {
          educationStructure: 'schedule',
          sessionRound: 'multi',
          educationScheduleMode: 'date',
        },
      }),
    }),
    ['line:0', 'line:1'],
  )
}

testHiddenScheduleAutoSubmitIds()

function testEducationScheduleWireContract() {
  const runtimeOption = {
    id: '187223',
    scheduleId: 187223,
    value: '187223',
    label: '26년 11월 12일(목) 00:00 ~ 23:59',
    startAt: '2026-11-12T00:00:00+09:00',
    endAt: '2026-11-12T23:59:00+09:00',
  }
  const choices = readRuntimeFixedScheduleChoiceItems(
    {
      scheduleInputMode: 'fixed_schedule_options',
      educationScheduleLines: ['26년 11월 6일(금) 10:00 ~ 12:00'],
      scheduleOptions: [
        runtimeOption,
        {
          id: '187224',
          value: '187224',
          label: '26년 11월 6일(금) 10:00 ~ 12:00',
        },
      ],
    },
    { items: [{ id: 'line:0', label: 'schema seed 2026.11.06' }] },
  )
  assert.deepEqual(
    choices?.map(item => item.id),
    ['187223', '187224'],
  )
  assert.equal(
    normalizeScheduleDisplayLabel(choices?.[0]?.label),
    '2026년 11월 12일(목) 00:00 ~ 23:59',
  )
  assert.equal(choices?.[0]?.id, runtimeOption.value)
  assert.notEqual(choices?.[0]?.id, choices?.[0]?.label)

  const missingRuntime = readRuntimeFixedScheduleChoiceItems(
    { scheduleInputMode: 'fixed_schedule_options', educationScheduleLines: ['26년 11월 6일(금)'] },
    { items: [{ id: 'line:0', label: '26년 11월 6일(금)' }] },
  )
  assert.equal(missingRuntime, null)

  const selected = toFixedScheduleOptionAnswerValue([
    { scheduleOptionId: '187224' },
    { scheduleOptionId: '187223' },
    { scheduleOptionId: '187223' },
  ])
  assert.deepEqual(selected, ['187224', '187223'])
  assert.equal(selected?.some(value => value.includes('년') || value.startsWith('line:')), false)

  const restored = selectedFixedScheduleIdsFromDraftAnswer(selected)
  assert.deepEqual(restored, ['187224', '187223'])

  const preferred = toPortalPreferredScheduleBlocks([
    {
      date: '2026-11-20',
      classPeriod: '1교시',
      startTime: '9:00',
      endTime: '12:00',
    },
  ])
  assert.deepEqual(preferred, [
    {
      preferenceRank: 1,
      date: '2026-11-20',
      sessionCount: 1,
      startTime: '09:00',
      endTime: '12:00',
      sessionTimes: [
        {
          sessionIndex: 1,
          classPeriod: '1교시',
          startTime: '09:00',
          endTime: '12:00',
          timeRange: '09:00~12:00',
        },
      ],
    },
  ])
  assert.equal(preferred[0]?.date.includes('년'), false)

  const secondPeriodPreferred = toPortalPreferredScheduleBlocks([
    {
      date: '2026-11-20',
      classPeriod: '2',
      startTime: '13:00',
      endTime: '15:00',
    },
  ])
  assert.equal(secondPeriodPreferred[0]?.sessionCount, 2)

  const incomplete = toPortalPreferredScheduleBlocks([
    { date: '2026-11-20', classPeriod: '', startTime: '', endTime: '' },
  ])
  assert.deepEqual(incomplete, [])

  const geminiMapOptions = geminiInstitutionPreferredScheduleMapOptions()
  assert.deepEqual(buildGeminiInstitutionSessionSelectOptions().map(option => option.value), [
    '2',
    '3',
    '4',
  ])
  assert.equal(GEMINI_INSTITUTION_SESSION_COUNT_MIN, 2)
  assert.equal(GEMINI_INSTITUTION_SESSION_COUNT_MAX, 4)

  const geminiWithoutPeriod = toPortalPreferredScheduleBlocks(
    [{ date: '2026-10-07', classPeriod: '', startTime: '01:00', endTime: '02:00' }],
    geminiMapOptions,
  )
  assert.deepEqual(geminiWithoutPeriod, [])
  assert.equal(
    findIncompletePreferredScheduleMessage(
      [{ date: '2026-10-07', classPeriod: '', startTime: '01:00', endTime: '02:00' }],
      geminiMapOptions,
    ),
    '진행 희망 교육 일정에 날짜·차시(교시)·시작/종료 시간을 모두 입력해 주세요.',
  )

  const geminiOneSession = toPortalPreferredScheduleBlocks(
    [{ date: '2026-10-07', classPeriod: '1', startTime: '01:00', endTime: '02:00' }],
    geminiMapOptions,
  )
  assert.deepEqual(geminiOneSession, [])
  assert.equal(
    findIncompletePreferredScheduleMessage(
      [{ date: '2026-10-07', classPeriod: '1', startTime: '01:00', endTime: '02:00' }],
      geminiMapOptions,
    ),
    '2차시 이상 최대 4차시까지 신청할 수 있습니다.',
  )

  const geminiFourSessions = toPortalPreferredScheduleBlocks(
    [{ date: '2026-10-07', classPeriod: '4', startTime: '01:00', endTime: '02:00' }],
    geminiMapOptions,
  )
  assert.equal(geminiFourSessions[0]?.sessionCount, 4)

  const geminiConsentDraft = {
    schemaVersion: 1,
    formSettings: {},
    paragraphs: [
      {
        id: 'gemini-vt-inst-seed-personal-info',
        kind: 'single_item',
        variant: 'horizontal_table',
        requiredMark: true,
        answerRequired: true,
        showBottomConsent: true,
        bottomConsent: undefined,
      },
    ],
  } as never
  assert.equal(
    findMissingRequiredBottomConsentId(geminiConsentDraft),
    'gemini-vt-inst-seed-personal-info',
  )

  const ujat = toPortalPreferredScheduleBlocks(
    [
      {
        date: '2026-11-20',
        classPeriod: '1교시',
        startTime: '10:00',
        endTime: '12:00',
      },
    ],
    { dateFieldsOnly: true },
  )
  assert.deepEqual(ujat, [{ preferenceRank: 1, date: '2026-11-20' }])

  const trainedChoices = readRuntimeFixedScheduleChoiceItems(
    {
      scheduleInputMode: 'fixed_schedule_options',
      scheduleOptions: [{ id: 'teacher-slot-1', value: 'teacher-slot-1', label: '26년 11월 6일(금)' }],
    },
    { items: [] },
  )
  assert.deepEqual(trainedChoices?.map(item => item.id), ['teacher-slot-1'])

  const answerKey = 'program-participant-application-seed-schedule'
  const body: PortalSaveApplicationRequest = {
    recruitmentId: 186702,
    applicationType: 'INDIVIDUAL',
    formBindingId: 189073,
    answers: { [answerKey]: selected },
    preferredScheduleBlocks: preferred,
    requestedSchedules: [],
  }
  const draftPut: PortalSaveApplicationRequest = { ...body, answers: { ...body.answers } }
  const applicationPost: PortalSaveApplicationRequest = { ...body, answers: { ...body.answers } }
  assert.deepEqual(draftPut, applicationPost)
  assert.deepEqual(draftPut.answers?.[answerKey], ['187224', '187223'])
  assert.equal(JSON.stringify(draftPut).includes('00:00 ~ 23:59'), false)
}

testEducationScheduleWireContract()

function testGeminiPreferredSchedulePad() {
  const padded = padPreferredScheduleBlocks(
    [{ date: '2026-11-10', classPeriod: '1', startTime: '10:00', endTime: '12:00' }],
    GEMINI_INSTITUTION_PREFERRED_SCHEDULE_BLOCK_COUNT
  )
  assert.equal(padded.length, 3)
  assert.equal(padded[0]?.date, '2026-11-10')
  assert.equal(padded[1]?.date, '')
  assert.equal(padded[2]?.classPeriod, '')

  const bounds = readGeminiTrainingRequestDateBounds({
    detailCase: 'gemini',
    geminiTrainingRequestStartDate: '2026-11-02',
    geminiTrainingRequestEndDate: '2026-11-30',
  })
  assert.deepEqual(bounds, {
    minScheduleDate: '2026-11-02',
    maxScheduleDate: '2026-11-30',
  })
  assert.equal(isGeminiTrainingRequestPeriodConfigured(bounds), true)
  assert.equal(
    hasPreferredScheduleDateOutsideBounds([{ date: '2026-11-02' }], bounds),
    false,
  )
  assert.equal(
    hasPreferredScheduleDateOutsideBounds([{ date: '2026-11-17' }], bounds),
    false,
  )
  assert.equal(
    hasPreferredScheduleDateOutsideBounds([{ date: '2026-11-30' }], bounds),
    false,
  )
  assert.equal(
    hasPreferredScheduleDateOutsideBounds([{ date: '2026-11-01' }], bounds),
    true,
  )
  assert.equal(
    hasPreferredScheduleDateOutsideBounds([{ date: '2026-12-01' }], bounds),
    true,
  )
  assert.equal(
    hasPreferredScheduleDateOutsideBounds([{ date: '2026-10-28' }], bounds),
    true,
  )
  assert.deepEqual(
    readGeminiTrainingRequestDateBounds({ detailCase: 'general' }),
    { minScheduleDate: null, maxScheduleDate: null },
  )
  const unconfigured = { minScheduleDate: null, maxScheduleDate: null }
  assert.equal(isGeminiTrainingRequestPeriodConfigured(unconfigured), false)
  assert.equal(
    hasPreferredScheduleDateOutsideBounds([{ date: '2026-11-17' }], unconfigured),
    true,
  )
  assert.equal(
    hasPreferredScheduleDateOutsideBounds([{ date: '' }], unconfigured),
    false,
  )
  const slots = filterItemsByScheduleDateBounds(
    [
      { id: 'in', dateKey: '2026-11-17' },
      { id: 'out', dateKey: '2026-10-28' },
      { id: 'undated' },
    ],
    item => item.dateKey,
    bounds,
  )
  assert.deepEqual(
    slots.map(slot => slot.id),
    ['in', 'undated'],
  )
  assert.deepEqual(
    filterGeminiInstructorSlotsByTrainingRequestPeriod(
      [
        { id: 'in', dateKey: '2026-11-17' },
        { id: 'out', dateKey: '2026-10-28' },
        { id: 'undated' },
      ],
      item => item.dateKey,
      bounds,
    ).map(slot => slot.id),
    ['in', 'undated'],
  )
  assert.deepEqual(
    filterGeminiInstructorSlotsByTrainingRequestPeriod(
      [{ id: 'approved', dateKey: '2026-10-22' }],
      item => item.dateKey,
      unconfigured,
    ).map(slot => slot.id),
    ['approved'],
  )
}

testGeminiPreferredSchedulePad()

function testEducationScheduleApplyConstraint() {
  const range = { start: '2026-10-01', end: '2026-12-31' }
  const fromRange = resolveEducationScheduleApplyConstraint({
    educationScheduleRange: range,
    failClosed: true,
  })
  assert.equal(fromRange.configured, true)
  assert.equal(fromRange.minDate, '2026-10-01')
  assert.equal(fromRange.maxDate, '2026-12-31')
  assert.equal(hasPreferredScheduleDateOutsideEducationConstraint([{ date: '2026-10-01' }], fromRange), false)
  assert.equal(hasPreferredScheduleDateOutsideEducationConstraint([{ date: '2026-12-31' }], fromRange), false)
  assert.equal(hasPreferredScheduleDateOutsideEducationConstraint([{ date: '2026-09-30' }], fromRange), true)
  assert.equal(hasPreferredScheduleDateOutsideEducationConstraint([{ date: '2027-01-01' }], fromRange), true)

  const fromRuntimePeriods = resolveEducationScheduleApplyConstraint({
    runtime: {
      scheduleInputMode: 'date_time_requests',
      allowedSchedulePeriods: [{ startDate: '2026-11-01', endDate: '2026-11-15' }],
    },
    educationScheduleRange: range,
    failClosed: true,
  })
  assert.equal(fromRuntimePeriods.minDate, '2026-11-01')
  assert.equal(fromRuntimePeriods.maxDate, '2026-11-15')
  assert.equal(fromRuntimePeriods.enabledDates?.has('2026-11-10'), true)
  assert.equal(fromRuntimePeriods.enabledDates?.has('2026-10-05'), false)
  assert.equal(
    hasPreferredScheduleDateOutsideEducationConstraint([{ date: '2026-10-05' }], fromRuntimePeriods),
    true
  )

  const fromRuntimeMinMax = resolveEducationScheduleApplyConstraint({
    runtime: {
      scheduleInputMode: 'date_time_requests',
      minScheduleDate: '2026-11-01',
      maxScheduleDate: '2026-11-30',
    },
    educationScheduleRange: range,
    failClosed: true,
  })
  assert.equal(fromRuntimeMinMax.minDate, '2026-11-01')
  assert.equal(fromRuntimeMinMax.maxDate, '2026-11-30')
  assert.equal(fromRuntimeMinMax.enabledDates, null)

  const fallbackWhenRuntimeEmpty = resolveEducationScheduleApplyConstraint({
    runtime: { scheduleInputMode: 'date_time_requests' },
    educationScheduleRange: range,
    failClosed: true,
  })
  assert.equal(fallbackWhenRuntimeEmpty.minDate, '2026-10-01')
  assert.equal(fallbackWhenRuntimeEmpty.maxDate, '2026-12-31')
  assert.equal(fallbackWhenRuntimeEmpty.configured, true)

  const unconfigured = resolveEducationScheduleApplyConstraint({ failClosed: true })
  assert.equal(unconfigured.configured, false)
  assert.equal(unconfigured.enabledDates?.size, 0)
  assert.equal(
    hasPreferredScheduleDateOutsideEducationConstraint([{ date: '2026-11-01' }], unconfigured),
    true
  )
  assert.equal(
    hasPreferredScheduleDateOutsideEducationConstraint([{ date: '' }], unconfigured),
    false
  )
}

testEducationScheduleApplyConstraint()

function testEmptyFixedScheduleApplyGate() {
  const education = { id: 'schedule:187653', scheduleId: 187653, label: '본교육' }
  const preEducation = {
    id: 'schedule:9001',
    scheduleId: 9001,
    label: '사전 교육',
  }
  const lookup = [
    { scheduleId: 187653, scheduleKind: 'EDUCATION' },
    { scheduleId: 9001, scheduleKind: 'PRE_EDUCATION' },
  ]
  const filtered = excludePreEducationScheduleChoices([education, preEducation], lookup)
  assert.deepEqual(
    filtered?.map(item => item.id),
    ['schedule:187653'],
  )
  assert.deepEqual(
    excludePreEducationScheduleChoices([preEducation], lookup)?.map(item => item.id),
    [],
  )
  const unlabeledEducation = {
    id: 'schedule:187653',
    scheduleId: 187653,
    label: '사전 교육',
  }
  assert.deepEqual(
    excludePreEducationScheduleChoices([unlabeledEducation], lookup)?.map(item => item.id),
    ['schedule:187653'],
  )
  const unknownKind = { id: 'schedule:9999', scheduleId: 9999, label: '미정' }
  assert.deepEqual(
    excludePreEducationScheduleChoices([unknownKind], lookup)?.map(item => item.id),
    ['schedule:9999'],
  )
  const nullKind = {
    id: 'schedule:8888',
    scheduleId: 8888,
    label: '종류없음',
  }
  assert.deepEqual(
    excludePreEducationScheduleChoices([nullKind], [{ scheduleId: 8888, scheduleKind: null }])?.map(
      item => item.id,
    ),
    ['schedule:8888'],
  )
  assert.equal(excludePreEducationScheduleChoices(null, lookup), null)

  assert.equal(
    shouldBlockApplyForEmptyFixedSchedule({
      applyCase: 'individual-general',
      scheduleInputMode: 'fixed_schedule_options',
      scheduleChoiceHidden: false,
      scheduleParagraphForcedHidden: false,
      educationScheduleChoices: [],
    }),
    true,
  )
  assert.equal(
    shouldBlockApplyForEmptyFixedSchedule({
      applyCase: 'individual-general',
      scheduleInputMode: 'fixed_schedule_options',
      scheduleChoiceHidden: false,
      scheduleParagraphForcedHidden: false,
      educationScheduleChoices: [education],
    }),
    false,
  )
  assert.equal(
    shouldBlockApplyForEmptyFixedSchedule({
      applyCase: 'individual-general',
      scheduleInputMode: 'fixed_schedule_options',
      scheduleChoiceHidden: false,
      scheduleParagraphForcedHidden: false,
      educationScheduleChoices: null,
    }),
    false,
  )
  assert.equal(
    shouldBlockApplyForEmptyFixedSchedule({
      applyCase: 'individual-general',
      scheduleInputMode: 'date_time_requests',
      scheduleChoiceHidden: false,
      scheduleParagraphForcedHidden: false,
      educationScheduleChoices: [],
    }),
    false,
  )
  assert.equal(
    shouldBlockApplyForEmptyFixedSchedule({
      applyCase: 'individual-general',
      scheduleInputMode: 'fixed_schedule_options',
      scheduleChoiceHidden: true,
      scheduleParagraphForcedHidden: false,
      educationScheduleChoices: [],
    }),
    false,
  )
  assert.equal(
    shouldBlockApplyForEmptyFixedSchedule({
      applyCase: 'individual-general',
      scheduleInputMode: 'fixed_schedule_options',
      scheduleChoiceHidden: false,
      scheduleParagraphForcedHidden: true,
      educationScheduleChoices: [],
    }),
    false,
  )
  assert.equal(
    shouldBlockApplyForEmptyFixedSchedule({
      applyCase: 'trained-teachers',
      scheduleInputMode: 'fixed_schedule_options',
      scheduleChoiceHidden: false,
      scheduleParagraphForcedHidden: false,
      educationScheduleChoices: [],
    }),
    false,
  )
  assert.equal(
    shouldExcludePreEducationFromApplyFixedSchedule({
      applyCase: 'institution-general',
      scheduleInputMode: 'fixed_schedule_options',
      scheduleParagraphForcedHidden: true,
    }),
    false,
  )
  const forcedHiddenIds = resolveHiddenScheduleAutoSubmitIds({
    hidden: true,
    forcedHidden: true,
    choiceIds: ['schedule:187653', 'schedule:9001'],
  })
  assert.deepEqual(forcedHiddenIds, ['schedule:187653', 'schedule:9001'])
  assert.equal(APPLY_EMPTY_FIXED_SCHEDULE_ALERT_TITLE, '신청 가능 교육 일정')
  assert.equal(
    APPLY_EMPTY_FIXED_SCHEDULE_ALERT_LINES.join('\n'),
    '현재 신청 가능한 교육 일정이 없습니다.\n프로그램 모집 정보를 다시 확인해주세요.',
  )
  assert.deepEqual(
    readApplyFixedScheduleChoiceIds({
      runtimeChoices: [],
      paragraph: { items: [{ id: 'line:0' }] },
    }),
    [],
  )
}

testEmptyFixedScheduleApplyGate()

console.log('apply-form-schedule.selfcheck: ok')
