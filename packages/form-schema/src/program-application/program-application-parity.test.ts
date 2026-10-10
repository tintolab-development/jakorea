import assert from 'node:assert/strict'
import {
  getInstitutionApplicationFormHiddenParagraphIds,
  readInstitutionFixedScheduleChoiceItems,
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

console.log('program-application-parity.test: ok')
