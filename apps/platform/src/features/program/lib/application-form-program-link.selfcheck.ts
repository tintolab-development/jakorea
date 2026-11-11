import assert from 'node:assert/strict'
import { createProgramApplicationFormInstitutionDraft } from '@jakorea/form-schema/paragraph-ids/program-application-form-institution-draft'
import { createProgramParticipantApplicationDraft } from '@jakorea/form-schema/paragraph-ids/program-application-form-individual-draft'
import { applyProgramLinkedApplicationDraftPatches } from './application-form-program-link.ts'

const draft = createProgramApplicationFormInstitutionDraft()
const program = {
  detailCase: 'general' as const,
  educationStructure: 'curriculum' as const,
  sessionRound: 'single' as const,
  educationScheduleMode: 'date' as const,
  educationScheduleLines: [
    '26년 10월 26일(월) 10:00 ~ 12:00',
    '26년 11월 2일(월) 13:30 ~ 16:00',
    '26년 11월 9일(월) 9:30 ~ 11:30',
  ],
  maxPreferredScheduleCount: 1,
  id: '186083',
  category: 'program' as const,
  title: 'test',
  educationForm: 'online' as const,
}

const patched = applyProgramLinkedApplicationDraftPatches(draft, {
  applyCase: 'institution-general',
  program: program as unknown as import('../model/types.ts').ProgramDetail,
  runtimeContext: {
    scheduleInputMode: 'fixed_schedule_options',
    scheduleOptions: [
      { id: 'line:0', label: '26년 10월 26일(월) 10:00 ~ 12:00' },
      { id: 'line:1', label: '26년 11월 2일(월) 13:30 ~ 16:00' },
      { id: 'line:2', label: '26년 11월 9일(월) 9:30 ~ 11:30' },
    ],
  },
})

const schedule = patched.paragraphs.find(p => p.id === 'program-application-institution-seed-schedule')
assert.ok(schedule && schedule.kind === 'single_item' && schedule.variant === 'multiple_choice')
assert.equal(schedule.items.length, 3)
assert.equal(
  schedule.paragraphDescription,
  '진행 가능한 일정을 모두 선택해 주세요. 모두 동일한 커리큘럼이며, 선택한 일정 중 1타임에 배정됩니다.'
)

const scheduleTypeProgram = {
  ...program,
  educationStructure: 'schedule' as const,
  id: 'general-prog-type-org-schedule-single',
}
const schedulePatched = applyProgramLinkedApplicationDraftPatches(draft, {
  applyCase: 'institution-general',
  program: scheduleTypeProgram as unknown as import('../model/types.ts').ProgramDetail,
  runtimeContext: {
    scheduleInputMode: 'fixed_schedule_options',
    scheduleOptions: [
      { id: 'line:0', label: '26년 10월 26일(월) 10:00 ~ 12:00' },
      { id: 'line:1', label: '26년 11월 2일(월) 13:30 ~ 16:00' },
      { id: 'line:2', label: '26년 11월 9일(월) 9:30 ~ 11:30' },
    ],
  },
})
const scheduleParagraph = schedulePatched.paragraphs.find(
  p => p.id === 'program-application-institution-seed-schedule'
)
assert.ok(
  scheduleParagraph &&
    scheduleParagraph.kind === 'single_item' &&
    scheduleParagraph.variant === 'multiple_choice'
)
assert.equal(scheduleParagraph.items.length, 3)
assert.equal(
  scheduleParagraph.paragraphDescription,
  '진행 가능한 일정을 모두 선택해 주세요. 모두 동일한 커리큘럼이며, 선택한 일정 중 1타임에 배정됩니다.'
)

const scheduleSinglePeriod = applyProgramLinkedApplicationDraftPatches(draft, {
  applyCase: 'institution-general',
  program: {
    ...scheduleTypeProgram,
    sessionRound: 'single',
    educationScheduleMode: 'period',
    maxPreferredScheduleCount: 4,
  } as unknown as import('../model/types.ts').ProgramDetail,
  runtimeContext: {
    educationStructure: 'SCHEDULE',
    sessionRound: 'SINGLE',
    educationScheduleMode: 'PERIOD',
    maxScheduleCount: 4,
    scheduleInputMode: 'date_time_requests',
  },
})
const periodParagraph = scheduleSinglePeriod.paragraphs.find(
  p => p.id === 'program-application-institution-seed-schedule'
)
assert.ok(
  periodParagraph &&
    periodParagraph.kind === 'single_item' &&
    periodParagraph.variant === 'multiple_choice'
)
assert.equal(
  periodParagraph.paragraphDescription,
  '교육을 희망하는 날짜를 모두 작성해 주세요. (최대 4개까지 희망 일정 신청이 가능합니다.)'
)

const individualDraft = createProgramParticipantApplicationDraft()
const individualPatched = applyProgramLinkedApplicationDraftPatches(individualDraft, {
  applyCase: 'individual-general',
  program: {
    ...program,
    sessions: [
      { sessionLabel: '1차시', title: 'A' },
      { sessionLabel: '2차시', title: 'B' },
    ],
  } as unknown as import('../model/types.ts').ProgramDetail,
  runtimeContext: {
    scheduleInputMode: 'fixed_schedule_options',
    scheduleOptions: [
      { id: 'line:0', label: '26년 10월 26일(월) 10:00 ~ 12:00' },
      { id: 'line:1', label: '26년 11월 2일(월) 13:30 ~ 16:00' },
      { id: 'line:2', label: '26년 11월 9일(월) 9:30 ~ 11:30' },
    ],
  },
})
const individualSchedule = individualPatched.paragraphs.find(
  p => p.id === 'program-participant-application-seed-schedule'
)
assert.ok(
  individualSchedule &&
    individualSchedule.kind === 'single_item' &&
    individualSchedule.variant === 'multiple_choice'
)
assert.equal(individualSchedule.items.length, 3)
assert.equal(
  individualSchedule.paragraphDescription,
  '진행 가능한 일정을 모두 선택해 주세요. 모두 동일한 커리큘럼이며, 선택한 일정 중 1타임에 배정됩니다.'
)
assert.equal(
  individualSchedule.items[0]?.label,
  '26년 10월 26일(월) 10:00 ~ 12:00 | 2차시'
)
const individualSameDayTwoSlots = applyProgramLinkedApplicationDraftPatches(
  createProgramParticipantApplicationDraft(),
  {
    applyCase: 'individual-general',
    program: {
      ...program,
      educationScheduleLines: [
        '26년 4월 20일(월) 09:30 ~ 12:20',
        '26년 4월 20일(월) 13:00 ~ 15:50',
      ],
    } as unknown as import('../model/types.ts').ProgramDetail,
  }
)
const individualSameDayParagraph = individualSameDayTwoSlots.paragraphs.find(
  p => p.id === 'program-participant-application-seed-schedule'
)
assert.ok(
  individualSameDayParagraph &&
    individualSameDayParagraph.kind === 'single_item' &&
    individualSameDayParagraph.variant === 'multiple_choice'
)
assert.equal(individualSameDayParagraph.items.length, 2)
const individualOneSlot = applyProgramLinkedApplicationDraftPatches(
  createProgramParticipantApplicationDraft(),
  {
    applyCase: 'individual-general',
    program: {
      ...program,
      educationScheduleLines: ['26년 4월 20일(월) 09:30 ~ 12:20'],
    } as unknown as import('../model/types.ts').ProgramDetail,
  }
)
assert.equal(
  individualOneSlot.paragraphs.some(p => p.id === 'program-participant-application-seed-schedule'),
  false
)

const individualMultiProgram = {
  detailCase: 'general' as const,
  educationStructure: 'curriculum' as const,
  sessionRound: 'multi' as const,
  educationScheduleMode: 'date' as const,
  educationScheduleLines: [
    '26년 4월 20일(월) 9:30 ~ 12:20',
    '26년 4월 27일(월) 13:00 ~ 15:50',
  ],
  sessions: [
    { sessionLabel: '1회차', title: '2' },
    { sessionLabel: '2회차', title: '2' },
  ],
  maxPreferredScheduleCount: 1,
  id: 'individual-curriculum-multi',
  category: 'program' as const,
  title: 'test',
  educationForm: 'online' as const,
}
const individualMultiPatched = applyProgramLinkedApplicationDraftPatches(
  createProgramParticipantApplicationDraft(),
  {
    applyCase: 'individual-general',
    program: individualMultiProgram as unknown as import('../model/types.ts').ProgramDetail,
    runtimeContext: { scheduleInputMode: 'fixed_schedule_options', scheduleOptions: [] },
  }
)
const individualMultiSchedule = individualMultiPatched.paragraphs.find(
  p => p.id === 'program-participant-application-seed-schedule'
)
assert.ok(individualMultiSchedule && individualMultiSchedule.variant === 'multiple_choice')
assert.equal(individualMultiSchedule.items.length, 2)
assert.equal(
  individualMultiSchedule.paragraphDescription,
  '2차시*2회로 구성된 프로그램입니다. 진행 가능한 일정을 모두 선택해 주세요.'
)
// 예정일 줄에는 실제 회차(sessionNo)가 없다 — 입력 순서로 「1회차」를 만들지 않는다
assert.equal(
  individualMultiSchedule.items[0]?.label,
  '26년 4월 20일(월) 9:30 ~ 12:20'
)

const individualMulti차시Title = applyProgramLinkedApplicationDraftPatches(
  createProgramParticipantApplicationDraft(),
  {
    applyCase: 'individual-general',
    program: {
      ...individualMultiProgram,
      sessions: [
        { sessionLabel: '1회차', title: '2차시' },
        { sessionLabel: '2회차', title: '4차시' },
      ],
    } as unknown as import('../model/types.ts').ProgramDetail,
    runtimeContext: { scheduleInputMode: 'fixed_schedule_options', scheduleOptions: [] },
  }
)
const individualMulti차시Paragraph = individualMulti차시Title.paragraphs.find(
  p => p.id === 'program-participant-application-seed-schedule'
)
// 1회차 2차시·2회차 4차시 — 회차별 차시 수가 다르므로 「2차시*2회」를 만들지 않는다
assert.equal(
  individualMulti차시Paragraph?.paragraphDescription,
  '진행 가능한 일정을 모두 선택해 주세요.'
)

const individualMultiBotTitle = applyProgramLinkedApplicationDraftPatches(
  createProgramParticipantApplicationDraft(),
  {
    applyCase: 'individual-general',
    program: {
      ...individualMultiProgram,
      sessions: [
        { sessionLabel: '1차시', title: '[BOT-TEST] 1차시' },
        { sessionLabel: '2차시', title: '[BOT-TEST] 2차시' },
        { sessionLabel: '3차시', title: '[BOT-TEST] 3차시' },
      ],
    } as unknown as import('../model/types.ts').ProgramDetail,
    runtimeContext: { scheduleInputMode: 'fixed_schedule_options', scheduleOptions: [] },
  }
)
const individualMultiBotParagraph = individualMultiBotTitle.paragraphs.find(
  p => p.id === 'program-participant-application-seed-schedule'
)
assert.equal(
  individualMultiBotParagraph?.paragraphDescription,
  '진행 가능한 일정을 모두 선택해 주세요.'
)

const individualScheduleSingle = applyProgramLinkedApplicationDraftPatches(
  createProgramParticipantApplicationDraft(),
  {
    applyCase: 'individual-general',
    program: {
      detailCase: 'general',
      educationStructure: 'schedule',
      sessionRound: 'single',
      educationScheduleMode: 'date',
      educationScheduleLines: [
        '26년 4월 20일(월) 09:30 ~ 12:20',
        '26년 4월 20일(월) 13:00 ~ 15:50',
        '26년 4월 27일(월) 09:30 ~ 12:20',
        '26년 4월 27일(월) 13:00 ~ 15:50',
      ],
      maxPreferredScheduleCount: 1,
      id: 'individual-schedule-single',
      category: 'program',
      title: 'test',
      educationForm: 'online',
    } as unknown as import('../model/types.ts').ProgramDetail,
    runtimeContext: {
      scheduleInputMode: 'fixed_schedule_options',
      scheduleOptions: [
        '26년 4월 20일(월) 09:30 ~ 12:20',
        '26년 4월 20일(월) 13:00 ~ 15:50',
        '26년 4월 27일(월) 09:30 ~ 12:20',
        '26년 4월 27일(월) 13:00 ~ 15:50',
      ].map((label, index) => ({ id: `line:${index}`, label })),
    },
  }
)
const individualScheduleTypeParagraph = individualScheduleSingle.paragraphs.find(
  p => p.id === 'program-participant-application-seed-schedule'
)
assert.ok(individualScheduleTypeParagraph?.variant === 'multiple_choice')
assert.equal(individualScheduleTypeParagraph.items.length, 4)
assert.ok(!individualScheduleTypeParagraph.items.some(item => item.label.includes('|')))
assert.equal(
  individualScheduleTypeParagraph.paragraphDescription,
  '진행 가능한 일정을 모두 선택해 주세요. 모두 동일한 커리큘럼이며, 선택한 일정 중 1타임에 배정됩니다.'
)

console.log('application-form-program-link.selfcheck: ok')
