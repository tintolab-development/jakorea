import assert from 'node:assert/strict'
import {
  getInstitutionApplicationFormHiddenParagraphIds,
  readInstitutionFixedScheduleChoiceItems,
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
  false
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
assert.equal((multiSchedule as MultipleChoiceParagraph).items.length, 4)
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
const scheduleOneDayHidden = syncApplicationScheduleChoiceParagraphsInDraft(institutionDraft, {
  educationStructure: 'schedule',
  sessionRound: 'single',
  educationScheduleMode: 'date',
  educationScheduleLines: [
    '26년 4월 20일(월) 09:30 ~ 12:20',
    '26년 4월 20일(월) 13:00 ~ 15:50',
  ],
  scheduleParagraphRaw: scheduleParagraph,
})
assert.equal(
  scheduleOneDayHidden.paragraphs.some(
    p => p.id === 'program-application-institution-seed-schedule'
  ),
  false
)
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
  false
)

console.log('program-application-parity.test: ok')
