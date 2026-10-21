import assert from 'node:assert/strict'
import { PROGRAM_APPLICATION_FORM_INSTITUTION_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-institution-draft'
import { PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-instructor-draft'
import { PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-trained-teachers-draft'
import { resolvePortalApplicationHiddenParagraphIds } from './portal-application-hidden-paragraph-ids.ts'
import {
  confirmOsaScheduleOptionValue,
  hasStaleSelectedSlotIds,
  isGeneralOrganizationProgram,
  pruneSelectedSlotIdsToCurrentOptions,
  usesConfirmedOsaAvailableSchedule,
} from './portal-confirmed-osa-schedule.ts'

assert.equal(isGeneralOrganizationProgram({ programType: 'GENERAL_ORGANIZATION' }), true)
assert.equal(isGeneralOrganizationProgram({ programType: 'GENERAL_INDIVIDUAL' }), false)
assert.equal(isGeneralOrganizationProgram({ programType: 'UJAT' }), false)
assert.equal(isGeneralOrganizationProgram({ programType: 'GEMINI_TRAINING' }), false)

assert.equal(
  usesConfirmedOsaAvailableSchedule({
    program: { programType: 'GENERAL_ORGANIZATION' },
    applyCase: 'instructor',
  }),
  true,
)
assert.equal(
  usesConfirmedOsaAvailableSchedule({
    program: { programType: 'GENERAL_ORGANIZATION' },
    applyCase: 'individual-volunteer',
  }),
  true,
)
assert.equal(
  usesConfirmedOsaAvailableSchedule({
    program: { programType: 'GENERAL_INDIVIDUAL' },
    applyCase: 'instructor',
  }),
  false,
)
assert.equal(
  usesConfirmedOsaAvailableSchedule({
    program: { programType: 'GENERAL_ORGANIZATION' },
    applyCase: 'instructor-gemini',
  }),
  false,
)

const optionA = confirmOsaScheduleOptionValue(186691, 1691277)
const optionB = confirmOsaScheduleOptionValue(186691, 1691299)
assert.equal(optionA, 'schedule:186691:organization-application:1691277')
assert.notEqual(optionA, optionB)

assert.deepEqual(
  pruneSelectedSlotIdsToCurrentOptions([optionA, optionB, 'stale'], [optionA, optionB]),
  [optionA, optionB],
)
assert.equal(hasStaleSelectedSlotIds([optionA], [optionA, optionB]), false)
assert.equal(hasStaleSelectedSlotIds([optionA, 'line:0'], [optionA]), true)

const instructorId = PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS.availableSchedule
const hiddenWhenDisabled = resolvePortalApplicationHiddenParagraphIds({
  applyCase: 'instructor',
  paragraphs: [{ id: instructorId } as never],
  instructorAvailableScheduleEnabled: false,
})
assert.equal(hiddenWhenDisabled.has(instructorId), true)

const shownWhenEnabled = resolvePortalApplicationHiddenParagraphIds({
  applyCase: 'instructor',
  paragraphs: [{ id: instructorId } as never],
  instructorAvailableScheduleEnabled: true,
})
assert.equal(shownWhenEnabled.has(instructorId), false)

const institutionGuidanceId = PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.guidance
const guidanceHiddenByProgramFlag = resolvePortalApplicationHiddenParagraphIds({
  applyCase: 'institution-general',
  program: { preEducationNoticeRequired: false } as never,
  paragraphs: [{ id: institutionGuidanceId } as never],
})
assert.equal(guidanceHiddenByProgramFlag.has(institutionGuidanceId), true)

const guidanceRuntimeOverridesProgram = resolvePortalApplicationHiddenParagraphIds({
  applyCase: 'institution-general',
  program: { preEducationNoticeRequired: false } as never,
  runtimeContext: { preEducationNoticeRequired: true },
  paragraphs: [{ id: institutionGuidanceId } as never],
})
assert.equal(guidanceRuntimeOverridesProgram.has(institutionGuidanceId), false)

const economyGuidanceId = 'program-application-economy-seed-guidance'
const economyGuidanceHidden = resolvePortalApplicationHiddenParagraphIds({
  applyCase: 'institution-economy',
  program: { preEducationNoticeRequired: false } as never,
  paragraphs: [{ id: economyGuidanceId } as never],
})
assert.equal(economyGuidanceHidden.has(economyGuidanceId), true)

const guidanceShownWhenFlagMissing = resolvePortalApplicationHiddenParagraphIds({
  applyCase: 'institution-general',
  program: {} as never,
  paragraphs: [{ id: institutionGuidanceId } as never],
})
assert.equal(guidanceShownWhenFlagMissing.has(institutionGuidanceId), false)

const guidanceHiddenByRuntime = resolvePortalApplicationHiddenParagraphIds({
  applyCase: 'institution-general',
  program: { preEducationNoticeRequired: true } as never,
  runtimeContext: { preEducationNoticeRequired: false },
  paragraphs: [{ id: institutionGuidanceId } as never],
})
assert.equal(guidanceHiddenByRuntime.has(institutionGuidanceId), true)

const instructorIgnoresInstitutionGuidanceFlag = resolvePortalApplicationHiddenParagraphIds({
  applyCase: 'instructor',
  program: { preEducationNoticeRequired: false } as never,
  paragraphs: [{ id: institutionGuidanceId } as never],
})
assert.equal(instructorIgnoresInstitutionGuidanceFlag.has(institutionGuidanceId), false)

const trainedScheduleId = PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS.preferredSchedule
const trainedScheduleHidden = resolvePortalApplicationHiddenParagraphIds({
  applyCase: 'trained-teachers',
  program: {
    educationStructure: 'schedule',
    sessionRound: 'multi',
    educationScheduleMode: 'date',
    educationScheduleLines: ['26년 4월 20일(일) 09:30 ~ 12:20'],
  } as never,
  paragraphs: [{ id: trainedScheduleId } as never],
})
assert.equal(trainedScheduleHidden.has(trainedScheduleId), true)

for (const scheduleOptions of [
  [],
  [{ id: 'schedule:1', label: '행사 1' }],
  [
    { id: 'schedule:1', label: '행사 1' },
    { id: 'schedule:2', label: '행사 2' },
  ],
]) {
  const trainedScheduleHiddenWithRuntimeOptions = resolvePortalApplicationHiddenParagraphIds({
    applyCase: 'trained-teachers',
    program: {
      educationStructure: 'schedule',
      sessionRound: 'multi',
      educationScheduleMode: 'date',
      educationScheduleLines: [
        '26년 4월 20일(월) 09:30 ~ 12:20',
        '26년 4월 20일(월) 13:00 ~ 15:50',
      ],
    } as never,
    runtimeContext: {
      scheduleInputMode: 'fixed_schedule_options',
      scheduleOptions,
    },
    paragraphs: [{ id: trainedScheduleId } as never],
  })
  assert.equal(trainedScheduleHiddenWithRuntimeOptions.has(trainedScheduleId), true)
}

const trainedCurriculumMultiDateVisible = resolvePortalApplicationHiddenParagraphIds({
  applyCase: 'trained-teachers',
  program: {
    educationStructure: 'curriculum',
    sessionRound: 'multi',
    educationScheduleMode: 'date',
    educationScheduleLines: ['2026-11-08 ~ 2027-02-24 종일'],
  } as never,
  runtimeContext: {
    scheduleInputMode: 'fixed_schedule_options',
    scheduleOptions: [
      { id: '201', value: '201', label: '2026-11-02 10:00~12:00' },
      { id: '202', value: '202', label: '2026-11-09 13:30~16:00' },
    ],
  },
  paragraphs: [{ id: trainedScheduleId } as never],
})
assert.equal(trainedCurriculumMultiDateVisible.has(trainedScheduleId), false)

const trainedCurriculumSingleOptionStillVisible = resolvePortalApplicationHiddenParagraphIds({
  applyCase: 'trained-teachers',
  program: {
    educationStructure: 'curriculum',
    sessionRound: 'multi',
    educationScheduleMode: 'date',
    educationScheduleLines: ['2026-11-08 ~ 2027-02-24 종일'],
  } as never,
  runtimeContext: {
    scheduleInputMode: 'fixed_schedule_options',
    scheduleOptions: [{ id: '201', value: '201', label: '2026-11-02 10:00~12:00' }],
  },
  paragraphs: [{ id: trainedScheduleId } as never],
})
assert.equal(trainedCurriculumSingleOptionStillVisible.has(trainedScheduleId), false)

const trainedCurriculumEmptyOptionsStillVisible = resolvePortalApplicationHiddenParagraphIds({
  applyCase: 'trained-teachers',
  program: {
    educationStructure: 'curriculum',
    sessionRound: 'multi',
    educationScheduleMode: 'date',
    educationScheduleLines: ['2026-11-08 ~ 2027-02-24 종일'],
  } as never,
  runtimeContext: {
    scheduleInputMode: 'fixed_schedule_options',
    scheduleOptions: [],
  },
  paragraphs: [{ id: trainedScheduleId } as never],
})
assert.equal(trainedCurriculumEmptyOptionsStillVisible.has(trainedScheduleId), false)

const institutionScheduleId = PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.scheduleChoice
const institutionScheduleHidden = resolvePortalApplicationHiddenParagraphIds({
  applyCase: 'institution-general',
  program: {
    educationStructure: 'schedule',
    sessionRound: 'multi',
    educationScheduleMode: 'date',
    educationScheduleLines: [
      '26년 4월 20일(월) 09:30 ~ 12:20',
      '26년 4월 20일(월) 13:00 ~ 15:50',
    ],
  } as never,
  runtimeContext: {
    scheduleInputMode: 'fixed_schedule_options',
    scheduleOptions: [
      { id: 'schedule:1', label: '행사 1' },
      { id: 'schedule:2', label: '행사 2' },
    ],
  },
  paragraphs: [{ id: institutionScheduleId } as never],
})
assert.equal(institutionScheduleHidden.has(institutionScheduleId), true)

console.log('portal-confirmed-osa-schedule.selfcheck: ok')
