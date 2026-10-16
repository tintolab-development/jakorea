import assert from 'node:assert/strict'
import { PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-instructor-draft'
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

console.log('portal-confirmed-osa-schedule.selfcheck: ok')
