import assert from 'node:assert/strict'
import { createProgramParticipantApplicationDraft } from '../../dist/paragraph-ids/program-application-form-individual-draft.js'
import {
  countUniqueEducationScheduleCalendarDays,
  expandEducationScheduleChoiceSlots,
  getInstitutionApplicationFormHiddenParagraphIds,
  isApplicationScheduleDefaultParagraphDescription,
  readCurriculumMultiDateFixedScheduleMeta,
  readInstitutionFixedScheduleChoiceItems,
  resolveFixedScheduleLinesToChoiceItems,
  shouldShowApplicationMaxSessionsPerDayField,
  shouldShowApplicationScheduleParagraph,
  shouldShowApplicationScheduleParagraphResolved,
  shouldShowTrainedTeachersApplicationMaxSessionsPerDayField,
  syncApplicationScheduleChoiceParagraphsInDraft,
  buildTrainedTeachersPreferredSessionCountOptions,
  resolveTrainedTeachersPreferredSessionCountMax,
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
// ① 커리큘럼·단일·날짜 — 일정형 단일과 같은 1타임 배정 안내
assert.equal(
  patchedSchedule.paragraphDescription,
  '진행 가능한 일정을 모두 선택해 주세요. 모두 동일한 커리큘럼이며, 선택한 일정 중 1타임에 배정됩니다.'
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
// 예정일 줄에는 실제 회차(sessionNo)가 없다 — 입력 순서로 「1회차」를 만들지 않는다
assert.equal(
  (multiSchedule as MultipleChoiceParagraph).items[0]?.label,
  '26년 4월 20일(월) 9:30 ~ 12:20'
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
  '진행 가능한 일정을 모두 선택해 주세요. 모두 동일한 커리큘럼이며, 선택한 일정 중 1타임에 배정됩니다.'
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

const individualMultiOmitEmpty = syncApplicationScheduleChoiceParagraphsInDraft(
  createProgramParticipantApplicationDraft(),
  {
    educationStructure: 'curriculum',
    sessionRound: 'multi',
    educationScheduleMode: 'date',
    educationScheduleLines: [
      '26년 4월 20일(월) 9:30 ~ 12:20',
      '26년 4월 27일(월) 13:00 ~ 15:50',
    ],
    unknownCount: 'omit',
    runtimeContext: { scheduleInputMode: 'fixed_schedule_options', scheduleOptions: [] },
  }
)
const individualMultiOmitEmptyParagraph = individualMultiOmitEmpty.paragraphs.find(
  p => p.id === 'program-participant-application-seed-schedule'
)
assert.equal(
  individualMultiOmitEmptyParagraph?.paragraphDescription,
  '진행 가능한 일정을 모두 선택해 주세요.'
)

// 회차별 진행 차시 수가 다르면(2차시/4차시) 1회차 값을 전체 회차 차시 수로 쓰지 않는다
assert.equal(
  readCurriculumMultiDateFixedScheduleMeta({
    curriculumSessions: [
      { sessionLabel: '1회차', title: '2차시' },
      { sessionLabel: '2회차', title: '4차시' },
    ],
  }).sessionsPerRound,
  undefined
)

// 안내 문구 = 신청 양식 기본값. 프로그램 등록 시 관리자가 수정한 문구는 유지, 구조(선택지)는 SSOT.
const CUSTOM_SCHEDULE_DESCRIPTION = '희망 일정을 모두 골라 주세요. 담당자가 개별 연락드립니다.'
const customDescriptionPatched = syncApplicationScheduleChoiceParagraphsInDraft(
  {
    ...institutionDraft,
    paragraphs: [{ ...scheduleParagraph, paragraphDescription: CUSTOM_SCHEDULE_DESCRIPTION }],
  },
  {
    educationStructure: 'schedule',
    sessionRound: 'single',
    educationScheduleMode: 'date',
    educationScheduleLines: [
      '26년 10월 26일(월) 10:00 ~ 12:00',
      '26년 11월 2일(월) 13:30 ~ 16:00',
    ],
  }
)
const customDescriptionSchedule = customDescriptionPatched.paragraphs[0] as MultipleChoiceParagraph
assert.equal(customDescriptionSchedule.paragraphDescription, CUSTOM_SCHEDULE_DESCRIPTION)
assert.equal(customDescriptionSchedule.items.length, 2)

const customPreferredPatched = syncApplicationScheduleChoiceParagraphsInDraft(
  {
    ...institutionDraft,
    paragraphs: [{ ...scheduleParagraph, paragraphDescription: CUSTOM_SCHEDULE_DESCRIPTION }],
  },
  {
    educationStructure: 'curriculum',
    sessionRound: 'multi',
    educationScheduleMode: 'period',
    maxScheduleCount: 3,
    maxSessionsPerDay: 4,
  }
)
const customPreferredSchedule = customPreferredPatched.paragraphs[0] as MultipleChoiceParagraph
assert.equal(customPreferredSchedule.paragraphDescription, CUSTOM_SCHEDULE_DESCRIPTION)
assert.deepEqual(customPreferredSchedule.items, [])

// 과거 자동 생성 문구가 저장돼 있으면 현행 기본 안내로 다시 계산한다.
const legacyDescriptionPatched = syncApplicationScheduleChoiceParagraphsInDraft(
  {
    ...institutionDraft,
    paragraphs: [
      {
        ...scheduleParagraph,
        paragraphDescription: '진행할 일정을 1개 선택해 주세요. 수업은 1일, 3차시 운영됩니다.',
      },
    ],
  },
  {
    educationStructure: 'curriculum',
    sessionRound: 'single',
    educationScheduleMode: 'date',
    educationScheduleLines: [
      '26년 10월 26일(월) 10:00 ~ 12:00',
      '26년 11월 2일(월) 13:30 ~ 16:00',
    ],
  }
)
assert.equal(
  legacyDescriptionPatched.paragraphs[0]?.paragraphDescription,
  '진행 가능한 일정을 모두 선택해 주세요. 모두 동일한 커리큘럼이며, 선택한 일정 중 1타임에 배정됩니다.'
)

for (const defaultText of [
  '',
  '프로그램 등록 시 노출되는 항목에 따라 설명글을 작성해 주세요.',
  '진행할 일정을 1개 선택해 주세요. 모두 동일한 커리큘럼이며, 선택한 일정에 배정됩니다.',
  '진행 가능한 일정을 모두 선택해 주세요.',
  '2차시*3회로 구성된 프로그램입니다. 진행 가능한 일정을 모두 선택해 주세요.',
  '교육을 희망하는 날짜를 모두 작성해 주세요. (최대 N개까지 희망 일정 신청이 가능합니다.)',
  '교육을 희망하는 날짜와 수업 시간을 모두 작성해 주세요. 수업은 1일, 4차시 운영됩니다. (최대 3개까지 희망 일정 신청이 가능합니다.)',
]) {
  assert.equal(isApplicationScheduleDefaultParagraphDescription(defaultText), true, defaultText)
}
assert.equal(isApplicationScheduleDefaultParagraphDescription(CUSTOM_SCHEDULE_DESCRIPTION), false)

// 「신청 가능 1일 최대 차시」 — 일반·1사1교는 커리큘럼·복수·기간만, 교육받은 교사는 커리큘럼(단일·복수)·기간
type MaxSessionsCase = {
  educationStructure: 'curriculum' | 'schedule'
  sessionRound: 'single' | 'multi'
  educationScheduleMode: 'date' | 'period'
  general: boolean
  trainedTeachers: boolean
}
const maxSessionsCases: MaxSessionsCase[] = [
  { educationStructure: 'curriculum', sessionRound: 'single', educationScheduleMode: 'period', general: false, trainedTeachers: true },
  { educationStructure: 'curriculum', sessionRound: 'multi', educationScheduleMode: 'period', general: true, trainedTeachers: true },
  { educationStructure: 'schedule', sessionRound: 'single', educationScheduleMode: 'period', general: false, trainedTeachers: false },
  { educationStructure: 'schedule', sessionRound: 'multi', educationScheduleMode: 'period', general: false, trainedTeachers: false },
  { educationStructure: 'curriculum', sessionRound: 'single', educationScheduleMode: 'date', general: false, trainedTeachers: false },
  { educationStructure: 'curriculum', sessionRound: 'multi', educationScheduleMode: 'date', general: false, trainedTeachers: false },
  { educationStructure: 'schedule', sessionRound: 'single', educationScheduleMode: 'date', general: false, trainedTeachers: false },
]
for (const { general, trainedTeachers, ...input } of maxSessionsCases) {
  const label = `${input.educationStructure}/${input.sessionRound}/${input.educationScheduleMode}`
  assert.equal(shouldShowApplicationMaxSessionsPerDayField(input), general, `general ${label}`)
  assert.equal(
    shouldShowTrainedTeachersApplicationMaxSessionsPerDayField(input),
    trainedTeachers,
    `trainedTeachers ${label}`
  )
}

// TT 희망 차시 상한 — 값 없으면 2차시, 있으면 그 값(상한 16). CMS 미리보기·Platform 공통
assert.equal(resolveTrainedTeachersPreferredSessionCountMax(undefined), 2)
assert.equal(resolveTrainedTeachersPreferredSessionCountMax(null), 2)
assert.equal(resolveTrainedTeachersPreferredSessionCountMax(0), 2)
assert.equal(resolveTrainedTeachersPreferredSessionCountMax(8), 8)
assert.equal(resolveTrainedTeachersPreferredSessionCountMax(30), 16)
assert.deepEqual(
  buildTrainedTeachersPreferredSessionCountOptions(3).map(option => option.label),
  ['1차시', '2차시', '3차시']
)

console.log('program-application-parity.test: ok')
