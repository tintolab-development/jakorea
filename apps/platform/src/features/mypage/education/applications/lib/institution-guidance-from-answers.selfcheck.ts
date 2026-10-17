import assert from 'node:assert/strict'
import { PROGRAM_APPLICATION_FORM_INSTITUTION_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-institution-draft'
import {
  buildInstitutionGuidanceAnswerPatch,
  mapInstitutionGuidanceFromApplicationAnswers,
  teacherGuidanceContentFromFormState,
} from './institution-guidance-from-answers'
import { emptyInstitutionGuidanceAnswers } from '@/features/program/ui/apply-institution-guidance/apply-institution-guidance'
import { emptyInstitutionSexOffense } from '@/features/program/ui/apply-institution-sex-offense/apply-institution-sex-offense-answers.ts'

const guidanceKey = PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.guidance
const answers = {
  [guidanceKey]: {
    'computer-in-room': 'pc',
    'waiting-place': 'room',
    meal: 'yes',
    'other-notes': 'notes',
  },
}

const formState = mapInstitutionGuidanceFromApplicationAnswers(answers, 'general')
assert.equal(formState.guidance['computer-in-room'], 'pc')

const patch = buildInstitutionGuidanceAnswerPatch(
  {
    guidance: formState.guidance,
    sexOffense: emptyInstitutionSexOffense(),
  },
  'general',
)
assert.ok(patch[guidanceKey])
assert.ok(
  patch[PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.sexOffenseConsentInquiryMethod],
)

const noSubmitPatch = buildInstitutionGuidanceAnswerPatch(
  {
    guidance: formState.guidance,
    sexOffense: { ...emptyInstitutionSexOffense(), submissionRequest: 'no_submit' },
  },
  'general',
)
assert.equal(
  PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.sexOffenseConsentInquiryMethod in noSubmitPatch,
  false,
)
assert.deepEqual(
  noSubmitPatch[PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.sexOffenseConsentSubmissionRequest],
  { submissionRequest: 'no_submit' },
)

const content = teacherGuidanceContentFromFormState({
  guidance: emptyInstitutionGuidanceAnswers(),
  sexOffense: { ...emptyInstitutionSexOffense(), submissionRequest: 'no_submit' },
})
assert.equal(content.sexOffenseConsentMethod, '동의서 미제출')

console.log('institution-guidance-from-answers.selfcheck: ok')
