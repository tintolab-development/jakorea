import assert from 'node:assert/strict'
import { createProgramApplicationFormInstitutionDraft } from '@jakorea/form-schema/paragraph-ids/program-application-form-institution-draft'
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

console.log('application-form-program-link.selfcheck: ok')
