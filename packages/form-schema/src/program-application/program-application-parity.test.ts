import assert from 'node:assert/strict'
import { createProgramParticipantApplicationDraft } from '../../dist/paragraph-ids/program-application-form-individual-draft.js'
import {
  countUniqueEducationScheduleCalendarDays,
  expandEducationScheduleChoiceSlots,
  getInstitutionApplicationFormHiddenParagraphIds,
  readCurriculumMultiDateFixedScheduleMeta,
  readInstitutionFixedScheduleChoiceItems,
  resolveFixedScheduleLinesToChoiceItems,
  shouldShowApplicationScheduleParagraph,
  shouldShowApplicationScheduleParagraphResolved,
  syncApplicationScheduleChoiceParagraphsInDraft,
} from '../../dist/program-application/index.js'
import type { MultipleChoiceParagraph, WritingFormDraft } from '../../dist/writing-form/index.js'

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

const serverScheduleOptionsWin = readInstitutionFixedScheduleChoiceItems(
  {
    scheduleInputMode: 'fixed_schedule_options',
    scheduleOptions: [
      { id: '187131', value: '187131', label: '26년 11월 2일(월) 10:00 ~ 12:00', scheduleId: 187131 },
      { id: '187132', value: '187132', label: '26년 11월 9일(월) 13:30 ~ 16:00', scheduleId: 187132 },
    ],
  },
  { items: [] },
  {
    educationStructure: 'curriculum',
    sessionRound: 'multi',
    educationScheduleMode: 'date',
    educationScheduleLines: [
      '26년 11월 2일(월) 10:00 ~ 12:00',
      '26년 11월 9일(월) 13:30 ~ 16:00',
    ],
  }
)
assert.deepEqual(serverScheduleOptionsWin?.map(item => item.id), ['187131', '187132'])

const legacyMatrixReplacedByLines = readInstitutionFixedScheduleChoiceItems(
  {
    scheduleInputMode: 'fixed_schedule_options',
    scheduleOptions: [
      { id: 'line:0:education-round:1', label: '26년 11월 2일(월) 10:00 ~ 12:00 | 1회차' },
      { id: 'line:0:education-round:2', label: '26년 11월 2일(월) 10:00 ~ 12:00 | 2회차' },
    ],
  },
  { items: [] },
  {
    educationStructure: 'curriculum',
    sessionRound: 'multi',
    educationScheduleMode: 'date',
    educationScheduleLines: ['26년 11월 2일(월) 10:00 ~ 12:00'],
  }
)
assert.deepEqual(legacyMatrixReplacedByLines, [
  { id: 'line:0', label: '26년 11월 2일(월) 10:00 ~ 12:00' },
])

const hiddenGuidance = getInstitutionApplicationFormHiddenParagraphIds({
  educationScheduleMode: 'date',
  educationScheduleLines: ['26년 4월 20일(월) 9:30 ~ 12:20'],
  preEducationNoticeRequired: false,
})
assert.ok(hiddenGuidance?.has('program-application-institution-seed-guidance'))

const scheduleParagraph: MultipleChoiceParagraph = {
  id: 'program-application-institution-seed-schedule',
  kind: 'single_item',
  variant: 'multiple_choice',
  requiredMark: true,
  paragraphTitle: '진행 희망 교육 일정',
  paragraphDescription: '',
  participatesInTitleNumbering: true,
  answerRequired: true,
  allowMultiple: true,
  items: [{ id: 'line:2', label: 'only seed' }],
  selectedPreviewSingleId: null,
  selectedPreviewMultipleIds: [],
}

const institutionDraft: WritingFormDraft = {
  schemaVersion: 1,
  formSettings: { titleNumbering: 'none' },
  paragraphs: [scheduleParagraph],
}

const patched = syncApplicationScheduleChoiceParagraphsInDraft(institutionDraft, {
  educationStructure: 'curriculum',
  sessionRound: 'single',
  educationScheduleMode: 'date',
  educationScheduleLines: [
    '26년 10월 26일(월) 10:00 ~ 12:00',
    '26년 11월 2일(월) 13:30 ~ 16:00',
    '26년 11월 9일(월) 9:30 ~ 11:30',
  ],
  runtimeContext: {
    scheduleInputMode: 'fixed_schedule_options',
    scheduleOptions: [
      { id: 'line:0', label: '26년 10월 26일(월) 10:00 ~ 12:00' },
      { id: 'line:1', label: '26년 11월 2일(월) 13:30 ~ 16:00' },
      { id: 'line:2', label: '26년 11월 9일(월) 9:30 ~ 11:30' },
    ],
  },
  scheduleParagraphRaw: scheduleParagraph,
})
const patchedSchedule = patched.paragraphs.find(
  p => p.id === 'program-application-institution-seed-schedule'
)
assert.ok(patchedSchedule && patchedSchedule.variant === 'multiple_choice')
const patchedItems = (patchedSchedule as MultipleChoiceParagraph).items
assert.equal(patchedItems.length, 3)
// ① 커리큘럼·단일·날짜 — 차시 메타 없으면 N placeholder
assert.equal(
  patchedSchedule.paragraphDescription,
  '진행 가능한 일정을 모두 선택해 주세요. 수업은 1일, N차시 운영됩니다.'
)

assert.equal(
  shouldShowApplicationScheduleParagraphResolved({
    educationStructure: 'curriculum',
    sessionRound: 'single',
    educationScheduleMode: 'date',
    educationScheduleLines: [],
    runtimeContext: {
      scheduleInputMode: 'fixed_schedule_options',
      scheduleOptions: [
        { id: 'line:0', label: '26년 10월 26일(월) 10:00 ~ 12:00' },
        { id: 'line:1', label: '26년 11월 2일(월) 13:30 ~ 16:00' },
      ],
    },
    scheduleParagraphRaw: scheduleParagraph,
  }),
  true
)

for (const scheduleOptions of [
  [],
  [{ id: 'schedule:1', label: '행사 1' }],
  [
    { id: 'schedule:1', label: '행사 1' },
    { id: 'schedule:2', label: '행사 2' },
  ],
]) {
  assert.equal(
    shouldShowApplicationScheduleParagraphResolved({
      educationStructure: 'schedule',
      sessionRound: 'multi',
      educationScheduleMode: 'date',
      educationScheduleLines: [
        '26년 4월 20일(월) 09:30 ~ 12:20',
        '26년 4월 20일(월) 13:00 ~ 15:50',
      ],
      runtimeContext: {
        scheduleInputMode: 'fixed_schedule_options',
        scheduleOptions,
      },
      scheduleParagraphRaw: scheduleParagraph,
    }),
    false
  )
}

assert.equal(
  countUniqueEducationScheduleCalendarDays([
    '26년 4월 20일(월) 09:30 ~ 12:20',
    '26년 4월 20일(월) 13:00 ~ 15:50',
  ]),
  1
)
assert.equal(
  shouldShowApplicationScheduleParagraph({
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
  shouldShowApplicationScheduleParagraph({
    educationStructure: 'curriculum',
    sessionRound: 'single',
    educationScheduleMode: 'date',
    educationScheduleLines: ['26년 4월 20일(월) 09:30 ~ 12:20'],
  }),
  false
)
const pipedSameDaySlots = [
  '26년 10월 30일(금) 13:30 ~ 15:30 | 26년 10월 30일(금) 09:30 ~ 11:30',
]
assert.deepEqual(expandEducationScheduleChoiceSlots(pipedSameDaySlots), [
  '26년 10월 30일(금) 13:30 ~ 15:30',
  '26년 10월 30일(금) 09:30 ~ 11:30',
])
assert.deepEqual(
  expandEducationScheduleChoiceSlots(['26년 4월 20일(월) 9:30 ~ 12:20 | 1회차']),
  ['26년 4월 20일(월) 9:30 ~ 12:20 | 1회차']
)
assert.equal(
  shouldShowApplicationScheduleParagraph({
    educationStructure: 'schedule',
    sessionRound: 'single',
    educationScheduleMode: 'date',
    educationScheduleLines: pipedSameDaySlots,
  }),
  true
)
assert.deepEqual(
  resolveFixedScheduleLinesToChoiceItems(
    {
      educationStructure: 'schedule',
      sessionRound: 'single',
      educationScheduleMode: 'date',
      educationScheduleLines: pipedSameDaySlots,
    },
    pipedSameDaySlots,
    {}
  ),
  [
    { id: 'line:0', label: '26년 10월 30일(금) 13:30 ~ 15:30' },
    { id: 'line:1', label: '26년 10월 30일(금) 09:30 ~ 11:30' },
  ]
)

const multiMatrixPatched = syncApplicationScheduleChoiceParagraphsInDraft(institutionDraft, {
  educationStructure: 'curriculum',
  sessionRound: 'multi',
  educationScheduleMode: 'date',
  educationScheduleLines: [
    '26년 4월 20일(월) 9:30 ~ 12:20',
    '26년 4월 27일(월) 13:00 ~ 15:50',
  ],
  educationRoundCount: 2,
  sessionsPerRound: 2,
  runtimeContext: { scheduleInputMode: 'fixed_schedule_options', scheduleOptions: [] },
  scheduleParagraphRaw: scheduleParagraph,
})
const multiSchedule = multiMatrixPatched.paragraphs.find(
  p => p.id === 'program-application-institution-seed-schedule'
)
assert.ok(multiSchedule && multiSchedule.variant === 'multiple_choice')
assert.equal((multiSchedule as MultipleChoiceParagraph).items.length, 2)
assert.equal(
  multiSchedule.paragraphDescription,
  '2차시*2회로 구성된 프로그램입니다. 진행 가능한 일정을 모두 선택해 주세요.'
)
assert.equal(
  (multiSchedule as MultipleChoiceParagraph).items[0]?.label,
  '26년 4월 20일(월) 9:30 ~ 12:20 | 1회차'
)

const scheduleSingleDateLines = [
  '26년 4월 20일(월) 09:30 ~ 12:20',
  '26년 4월 20일(월) 13:00 ~ 15:50',
  '26년 4월 27일(월) 09:30 ~ 12:20',
  '26년 4월 27일(월) 13:00 ~ 15:50',
]
const scheduleSingleDatePatched = syncApplicationScheduleChoiceParagraphsInDraft(
  institutionDraft,
  {
    educationStructure: 'schedule',
    sessionRound: 'single',
    educationScheduleMode: 'date',
    educationScheduleLines: scheduleSingleDateLines,
    runtimeContext: {
      scheduleInputMode: 'fixed_schedule_options',
      scheduleOptions: scheduleSingleDateLines.map((label, index) => ({
        id: `line:${index}`,
        label,
      })),
    },
    scheduleParagraphRaw: scheduleParagraph,
  }
)
const scheduleSingleDateParagraph = scheduleSingleDatePatched.paragraphs.find(
  p => p.id === 'program-application-institution-seed-schedule'
)
assert.ok(
  scheduleSingleDateParagraph && scheduleSingleDateParagraph.variant === 'multiple_choice'
)
const scheduleSingleDateItems = (scheduleSingleDateParagraph as MultipleChoiceParagraph).items
assert.equal(scheduleSingleDateItems.length, 4)
assert.equal(
  scheduleSingleDateParagraph.paragraphDescription,
  '진행 가능한 일정을 모두 선택해 주세요. 모두 동일한 커리큘럼이며, 선택한 일정 중 1타임에 배정됩니다.'
)
assert.ok(!scheduleSingleDateItems.some(item => item.label.includes('|')))
assert.equal(
  shouldShowApplicationScheduleParagraph({
    educationStructure: 'schedule',
    sessionRound: 'single',
    educationScheduleMode: 'date',
    educationScheduleLines: scheduleSingleDateLines,
  }),
  true
)
const scheduleSameDayTwoSlots = syncApplicationScheduleChoiceParagraphsInDraft(
  institutionDraft,
  {
    educationStructure: 'schedule',
    sessionRound: 'single',
    educationScheduleMode: 'date',
    educationScheduleLines: [
      '26년 4월 20일(월) 09:30 ~ 12:20',
      '26년 4월 20일(월) 13:00 ~ 15:50',
    ],
    scheduleParagraphRaw: scheduleParagraph,
  }
)
const scheduleSameDayParagraph = scheduleSameDayTwoSlots.paragraphs.find(
  p => p.id === 'program-application-institution-seed-schedule'
)
assert.ok(
  scheduleSameDayParagraph && scheduleSameDayParagraph.variant === 'multiple_choice'
)
assert.equal((scheduleSameDayParagraph as MultipleChoiceParagraph).items.length, 2)
assert.equal(
  shouldShowApplicationScheduleParagraph({
    educationStructure: 'schedule',
    sessionRound: 'single',
    educationScheduleMode: 'date',
    educationScheduleLines: [
      '26년 4월 20일(월) 09:30 ~ 12:20',
      '26년 4월 20일(월) 13:00 ~ 15:50',
    ],
  }),
  true
)
const scheduleOneSlotHidden = syncApplicationScheduleChoiceParagraphsInDraft(
  institutionDraft,
  {
    educationStructure: 'schedule',
    sessionRound: 'single',
    educationScheduleMode: 'date',
    educationScheduleLines: ['26년 4월 20일(월) 09:30 ~ 12:20'],
    scheduleParagraphRaw: scheduleParagraph,
  }
)
assert.equal(
  scheduleOneSlotHidden.paragraphs.some(
    p => p.id === 'program-application-institution-seed-schedule'
  ),
  false
)

const individualDraft = createProgramParticipantApplicationDraft()
const individualCurriculumDatePatched = syncApplicationScheduleChoiceParagraphsInDraft(
  individualDraft,
  {
    educationStructure: 'curriculum',
    sessionRound: 'single',
    educationScheduleMode: 'date',
    educationScheduleLines: [
      '26년 4월 20일(월) 9:30 ~ 12:20',
      '26년 4월 27일(월) 13:00 ~ 15:50',
    ],
    curriculumChartSessionCount: 2,
    runtimeContext: { scheduleInputMode: 'fixed_schedule_options', scheduleOptions: [] },
  }
)
const individualScheduleParagraph = individualCurriculumDatePatched.paragraphs.find(
  p => p.id === 'program-participant-application-seed-schedule'
)
assert.ok(
  individualScheduleParagraph && individualScheduleParagraph.variant === 'multiple_choice'
)
assert.equal((individualScheduleParagraph as MultipleChoiceParagraph).items.length, 2)
assert.equal(
  individualScheduleParagraph.paragraphDescription,
  '진행 가능한 일정을 모두 선택해 주세요. 수업은 1일, 2차시 운영됩니다.'
)
// ① 모든 예정일 줄 = 커리큘럼 총 차시
assert.equal(
  (individualScheduleParagraph as MultipleChoiceParagraph).items[0]?.label,
  '26년 4월 20일(월) 9:30 ~ 12:20 | 2차시'
)
assert.equal(
  (individualScheduleParagraph as MultipleChoiceParagraph).items[1]?.label,
  '26년 4월 27일(월) 13:00 ~ 15:50 | 2차시'
)

const individualScheduleSingleDatePatched = syncApplicationScheduleChoiceParagraphsInDraft(
  createProgramParticipantApplicationDraft(),
  {
    educationStructure: 'schedule',
    sessionRound: 'single',
    educationScheduleMode: 'date',
    educationScheduleLines: [
      '26년 4월 20일(월) 09:30 ~ 12:20',
      '26년 4월 27일(월) 13:00 ~ 15:50',
    ],
    runtimeContext: { scheduleInputMode: 'fixed_schedule_options', scheduleOptions: [] },
  }
)
const individualScheduleTypeParagraph = individualScheduleSingleDatePatched.paragraphs.find(
  p => p.id === 'program-participant-application-seed-schedule'
)
assert.ok(individualScheduleTypeParagraph && individualScheduleTypeParagraph.variant === 'multiple_choice')
assert.equal((individualScheduleTypeParagraph as MultipleChoiceParagraph).items.length, 2)
assert.ok(
  !(individualScheduleTypeParagraph as MultipleChoiceParagraph).items.some(item =>
    item.label.includes('|')
  )
)
assert.equal(
  individualScheduleTypeParagraph.paragraphDescription,
  '진행 가능한 일정을 모두 선택해 주세요. 모두 동일한 커리큘럼이며, 선택한 일정 중 1타임에 배정됩니다.'
)

const individualMultiDraft = createProgramParticipantApplicationDraft()
const individualMultiPatched = syncApplicationScheduleChoiceParagraphsInDraft(
  individualMultiDraft,
  {
    educationStructure: 'curriculum',
    sessionRound: 'multi',
    educationScheduleMode: 'date',
    educationScheduleLines: [
      '26년 4월 20일(월) 9:30 ~ 12:20',
      '26년 4월 27일(월) 13:00 ~ 15:50',
    ],
    educationRoundCount: 2,
    sessionsPerRound: 2,
    runtimeContext: { scheduleInputMode: 'fixed_schedule_options', scheduleOptions: [] },
  }
)
const individualMultiParagraph = individualMultiPatched.paragraphs.find(
  p => p.id === 'program-participant-application-seed-schedule'
)
assert.ok(individualMultiParagraph && individualMultiParagraph.variant === 'multiple_choice')
assert.equal((individualMultiParagraph as MultipleChoiceParagraph).items.length, 2)
assert.equal(
  individualMultiParagraph.paragraphDescription,
  '2차시*2회로 구성된 프로그램입니다. 진행 가능한 일정을 모두 선택해 주세요.'
)

assert.equal(
  readCurriculumMultiDateFixedScheduleMeta({
    curriculumSessions: [
      { sessionLabel: '1회차', title: '2차시' },
      { sessionLabel: '2회차', title: '4차시' },
    ],
  }).sessionsPerRound,
  2
)

console.log('program-application-parity.test: ok')
