import assert from 'node:assert/strict'
import {
  expandUjatPreferredEducationScheduleOptionsFromHalfRanges,
  hasUjatPreferredEducationDateOptionsKey,
  mapUjatEducationHalfRangesFromSchedules,
  readUjatPreferredEducationScheduleOptions,
  readUjatPreferredEducationScheduleOptionsFromSubmittedAnswer,
  resolveUjatApplyPreferredEducationScheduleOptions,
  resolveUjatPreferredScheduleSelectedOptions,
  resolveUjatProgressConfirmPreferredEducationScheduleOptions,
} from './ujat-preferred-education-schedule-options.ts'

function testRuntimeOptionsUseIdAndLabel() {
  const options = readUjatPreferredEducationScheduleOptions({
    runtimeContext: {
      ujatPreferredEducationDateOptions: [
        { id: 'h2:2029-04-12', date: '2029-04-12', label: '29년 4월 12일(금)' },
        { id: 'h1:2029-04-05', date: '2029-04-05', label: '29년 4월 5일(금)' },
      ],
    },
  })
  assert.deepEqual(options, [
    { id: 'h2:2029-04-12', date: '2029-04-12', display: '29년 4월 12일(금)' },
    { id: 'h1:2029-04-05', date: '2029-04-05', display: '29년 4월 5일(금)' },
  ])
}

function testEmptyArrayDoesNotInventFridays() {
  const options = readUjatPreferredEducationScheduleOptions({
    runtimeContext: {
      ujatPreferredEducationDateOptions: [],
      educationScheduleLines: ['상반기: 2029.04.03 ~ 2029.06.19'],
    },
  })
  assert.deepEqual(options, [])
}

function testMissingFieldIsEmpty() {
  const options = readUjatPreferredEducationScheduleOptions({
    runtimeContext: { educationScheduleLines: ['상반기: 2029.04.03 ~ 2029.06.19'] },
  })
  assert.deepEqual(options, [])
}

function testSelectedTokensMatchIdWithoutInventingFromDate() {
  const options = readUjatPreferredEducationScheduleOptions({
    runtimeContext: {
      ujatPreferredEducationDateOptions: [
        { id: 'h1:2026-04-24', date: '2026-04-24', label: '26년 4월 24일(금)' },
        { id: 'h1:2026-05-08', date: '2026-05-08', label: '26년 5월 8일(금)' },
      ],
    },
  })
  const selected = resolveUjatPreferredScheduleSelectedOptions(
    ['2026-04-24', 'h1:2026-05-08', '2026-11-20'],
    options,
  )
  assert.deepEqual(
    selected.map(option => option.id),
    ['h1:2026-05-08'],
  )
}

function testSubmittedAnswerDoesNotInventUnselectedFridays() {
  const options = readUjatPreferredEducationScheduleOptionsFromSubmittedAnswer({
    selectedIds: ['h1:2027-04-30'],
    dates: ['2027-04-30', '2027-06-04'],
  })
  assert.deepEqual(
    options.map(option => option.date),
    ['2027-04-30', '2027-06-04'],
  )
  assert.equal(options[0]?.id, 'h1:2027-04-30')
}

function testDatetimeAndIdOnlyRowsParse() {
  const options = readUjatPreferredEducationScheduleOptions({
    runtimeContext: {
      audienceApplication: {
        ujatPreferredEducationDateOptions: [
          { id: 'h1:2026-04-03T00:00:00+09:00' },
          { date: '2026-04-10T15:00:00Z', label: '26년 4월 11일(토)' },
        ],
      },
    },
  })
  assert.deepEqual(
    options.map(option => ({ id: option.id, date: option.date })),
    [{ id: 'h1:2026-04-03', date: '2026-04-03' }],
  )
}

function testEmptyRuntimeDoesNotUseEducationHalfRanges() {
  const halfRanges = mapUjatEducationHalfRangesFromSchedules([
    {
      scheduleKind: 'PRE_EDUCATION',
      term: 'FIRST_HALF',
      startAt: '2026-03-15T15:00:00Z',
      endAt: '2026-03-16T14:59:59Z',
    },
    {
      scheduleKind: 'EDUCATION',
      term: 'FIRST_HALF',
      startAt: '2026-03-25T15:00:00Z',
      endAt: '2026-04-02T14:59:59Z',
    },
    {
      scheduleKind: 'EDUCATION',
      term: 'SECOND_HALF',
      startAt: '2026-09-09T15:00:00Z',
      endAt: '2026-09-11T14:59:59Z',
    },
  ])
  const options = resolveUjatApplyPreferredEducationScheduleOptions({
    runtimeContext: {
      ujatPreferredEducationDateOptions: [],
      educationScheduleLines: ['상반기: 2029.04.03 ~ 2029.06.19'],
    },
    halfRanges,
  })
  assert.deepEqual(options, [])
}

function testNonEmptyRuntimeWinsOverHalfRanges() {
  const options = resolveUjatApplyPreferredEducationScheduleOptions({
    runtimeContext: {
      ujatPreferredEducationDateOptions: [
        { id: 'h1:2026-04-24', date: '2026-04-24', label: '26년 4월 24일(금)' },
      ],
    },
    halfRanges: [
      { half: 'h1', startAt: '2026-03-26', endAt: '2026-04-03' },
    ],
  })
  assert.deepEqual(
    options.map(option => option.id),
    ['h1:2026-04-24'],
  )
}

function testHalfRangeFridaysInclusiveSeoul() {
  const options = expandUjatPreferredEducationScheduleOptionsFromHalfRanges([
    { half: 'h1', startAt: '2026-04-03T00:00:00.000Z', endAt: '2026-04-17T00:00:00.000Z' },
  ])
  assert.deepEqual(
    options.map(option => option.id),
    ['h1:2026-04-03', 'h1:2026-04-10', 'h1:2026-04-17'],
  )
}

function testProgressConfirmUsesRenderThenSupplementWithoutHalfRanges() {
  assert.equal(
    hasUjatPreferredEducationDateOptionsKey({
      ujatPreferredEducationDateOptions: [],
    }),
    true,
  )
  const emptyFromRender = resolveUjatProgressConfirmPreferredEducationScheduleOptions({
    runtimeContext: { ujatPreferredEducationDateOptions: [] },
    supplementPreferredEducationDateOptions: [
      { id: 'h1:2026-11-06', date: '2026-11-06', label: '11월 6일' },
    ],
  })
  assert.deepEqual(emptyFromRender, [])

  const fromSupplement = resolveUjatProgressConfirmPreferredEducationScheduleOptions({
    runtimeContext: { educationScheduleLines: ['ignored'] },
    supplementPreferredEducationDateOptions: [
      { id: 'h1:2026-11-06', date: '2026-11-06', label: '11월 6일' },
    ],
  })
  assert.deepEqual(
    fromSupplement.map(option => option.id),
    ['h1:2026-11-06'],
  )

  const missingBoth = resolveUjatProgressConfirmPreferredEducationScheduleOptions({
    runtimeContext: {},
    supplementPreferredEducationDateOptions: null,
  })
  assert.deepEqual(missingBoth, [])
}

testRuntimeOptionsUseIdAndLabel()
testEmptyArrayDoesNotInventFridays()
testMissingFieldIsEmpty()
testSelectedTokensMatchIdWithoutInventingFromDate()
testSubmittedAnswerDoesNotInventUnselectedFridays()
testDatetimeAndIdOnlyRowsParse()
testEmptyRuntimeDoesNotUseEducationHalfRanges()
testNonEmptyRuntimeWinsOverHalfRanges()
testHalfRangeFridaysInclusiveSeoul()
testProgressConfirmUsesRenderThenSupplementWithoutHalfRanges()
console.log('ujat-preferred-education-schedule-options: ok')
