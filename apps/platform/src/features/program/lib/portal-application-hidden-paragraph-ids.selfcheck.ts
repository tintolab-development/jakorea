/**
 * 일반 프로그램 개인·기관 신청 — 진행 희망 교육 일정 단락 숨김 규칙 공통화.
 * 프로그램 상세 표시 줄(educationScheduleLines)과 runtime program_schedule 선택지가 어긋나도
 * 개인·기관이 같은 판정(`shouldShowApplicationScheduleParagraphResolved`)을 따른다.
 */
import assert from 'node:assert/strict'
import { PROGRAM_APPLICATION_FORM_INSTITUTION_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-institution-draft'
import { PROGRAM_PARTICIPANT_APPLICATION_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-individual-draft'
import type { ProgramDetail } from '../model/types.ts'
import { resolvePortalApplicationHiddenParagraphIds } from './portal-application-hidden-paragraph-ids.ts'

const institutionScheduleId = PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.scheduleChoice
const individualScheduleId = PROGRAM_PARTICIPANT_APPLICATION_IDS.scheduleChoice

function programWith(fields: Partial<ProgramDetail>): ProgramDetail {
  return {
    educationStructure: 'curriculum',
    sessionRound: 'single',
    educationScheduleMode: 'date',
    educationScheduleLines: [],
    ...fields,
  } as ProgramDetail
}

const threeProgramScheduleOptions = {
  scheduleInputMode: 'fixed_schedule_options',
  scheduleOptions: [
    { id: '187131', value: '187131', scheduleId: 187131, label: '26년 10월 26일(월) 10:00 ~ 12:00' },
    { id: '187132', value: '187132', scheduleId: 187132, label: '26년 11월 2일(월) 13:30 ~ 16:00' },
    { id: '187133', value: '187133', scheduleId: 187133, label: '26년 11월 9일(월) 9:30 ~ 11:30' },
  ],
}

function scheduleHidden(input: {
  applyCase: 'institution-general' | 'individual-general'
  program: ProgramDetail
  runtimeContext?: unknown
}): boolean {
  const id = input.applyCase === 'institution-general' ? institutionScheduleId : individualScheduleId
  return resolvePortalApplicationHiddenParagraphIds({
    applyCase: input.applyCase,
    program: input.program,
    runtimeContext: input.runtimeContext,
    paragraphs: [{ id } as never],
  }).has(id)
}

const cases: Array<{
  name: string
  program: ProgramDetail
  runtimeContext?: unknown
  hidden: boolean
}> = [
  {
    name: '표시 줄 0개 + runtime 선택지 3개 → 노출',
    program: programWith({ educationScheduleLines: [] }),
    runtimeContext: threeProgramScheduleOptions,
    hidden: false,
  },
  {
    name: '표시 줄 1개(범위) + runtime 선택지 3개 → 노출',
    program: programWith({ educationScheduleLines: ['2026. 10. 26 ~ 2026. 11. 09'] }),
    runtimeContext: threeProgramScheduleOptions,
    hidden: false,
  },
  {
    name: '표시 줄 1개 + runtime 선택지 없음 → 숨김',
    program: programWith({ educationScheduleLines: ['26년 10월 26일(월) 10:00 ~ 12:00'] }),
    hidden: true,
  },
  {
    name: '표시 줄 2개 + runtime 없음 → 노출',
    program: programWith({
      educationScheduleLines: [
        '26년 10월 26일(월) 10:00 ~ 12:00',
        '26년 11월 2일(월) 13:30 ~ 16:00',
      ],
    }),
    hidden: false,
  },
  {
    name: '일정형+복수 → runtime 선택지가 있어도 강제 숨김',
    program: programWith({ educationStructure: 'schedule', sessionRound: 'multi' }),
    runtimeContext: threeProgramScheduleOptions,
    hidden: true,
  },
  {
    name: '기간 지정 → 노출',
    program: programWith({ educationScheduleMode: 'period' }),
    hidden: false,
  },
]

for (const testCase of cases) {
  const institution = scheduleHidden({ applyCase: 'institution-general', ...testCase })
  const individual = scheduleHidden({ applyCase: 'individual-general', ...testCase })
  assert.equal(institution, testCase.hidden, `기관: ${testCase.name}`)
  assert.equal(individual, testCase.hidden, `개인: ${testCase.name}`)
}

console.log('portal-application-hidden-paragraph-ids.selfcheck: ok')
