import assert from 'node:assert/strict'
import { PROGRAM_APPLICATION_FORM_ECONOMY_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-economy-draft'
import { PROGRAM_APPLICATION_FORM_INSTITUTION_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-institution-draft'
import {
  buildInstitutionGuidanceAnswerPatch,
  mapInstitutionGuidanceFromApplicationAnswers,
  teacherGuidanceContentFromFormState,
} from './institution-guidance-from-answers.ts'
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
assert.equal(
  PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.sexOffenseConsentInquiryMethod in patch,
  false,
)

const economyGuidanceKey = PROGRAM_APPLICATION_FORM_ECONOMY_IDS.guidance
const economyAnswers = {
  [economyGuidanceKey]: {
    'computer-in-room': 'economy-pc',
    'waiting-place': 'economy-room',
    meal: 'economy-meal',
    'other-notes': 'economy-notes',
  },
}
const economyFormState = mapInstitutionGuidanceFromApplicationAnswers(economyAnswers, 'general')
assert.equal(economyFormState.guidance['computer-in-room'], 'economy-pc')
const economyPatch = buildInstitutionGuidanceAnswerPatch(
  {
    guidance: economyFormState.guidance,
    sexOffense: emptyInstitutionSexOffense(),
  },
  'general',
  economyAnswers,
)
assert.ok(economyPatch[economyGuidanceKey])
assert.equal(guidanceKey in economyPatch, false)

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
assert.equal(content.sexOffenseConsentMethod, undefined)

const jaSystemContent = teacherGuidanceContentFromFormState({
  guidance: emptyInstitutionGuidanceAnswers(),
  sexOffense: {
    ...emptyInstitutionSexOffense(),
    submissionRequest: 'request',
    inquiryMethod: 'ja_system',
  },
})
assert.equal(
  jaSystemContent.sexOffenseConsentMethod,
  '기관이 JA 시스템 내에서 동의서 확인 후 직접 조회',
)

const directContent = teacherGuidanceContentFromFormState({
  guidance: emptyInstitutionGuidanceAnswers(),
  sexOffense: {
    ...emptyInstitutionSexOffense(),
    submissionRequest: 'request',
    inquiryMethod: 'criminal_record_site',
    siteSubmission: 'direct',
    institutionId: 'org-1',
    verificationNumber: 'v-9',
  },
})
assert.equal(directContent.sexOffenseConsentMethod, '직접 제출 | ID : org-1 | 검증번호 : v-9')

const ujatGuidanceKey = PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.guidance
const ujatAnswers = {
  [ujatGuidanceKey]: {
    'computer-in-room': 'tablet',
    'waiting-place': 'lab',
    meal: 'bin',
    'other-notes': 'park',
    snackAvailability: 'possible',
    classroomSettingConfirmed: 'confirmed',
  },
  [PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.sexOffenseConsentSubmissionRequest]: {
    submissionRequest: 'request',
  },
  [PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.sexOffenseConsentInquiryMethod]: {
    inquiryMethod: 'criminal_record_site',
    siteSubmission: 'online',
    institutionId: 'tinto',
    verificationNumber: '940412',
  },
}
const ujatFormState = mapInstitutionGuidanceFromApplicationAnswers(
  ujatAnswers,
  'ujat-participant',
)
assert.equal(ujatFormState.ujatExtras?.snackAvailability, 'possible')
assert.equal(ujatFormState.ujatExtras?.classroomSettingConfirmed, 'confirmed')
assert.equal(ujatFormState.sexOffense.siteSubmission, 'online')
assert.equal(ujatFormState.sexOffense.institutionId, 'tinto')
const ujatPatch = buildInstitutionGuidanceAnswerPatch(
  ujatFormState,
  'ujat-participant',
  ujatAnswers,
)
assert.equal(
  (ujatPatch[ujatGuidanceKey] as { snackAvailability?: string }).snackAvailability,
  'possible',
)
assert.ok(
  PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.sexOffenseConsentInquiryMethod in ujatPatch,
)

console.log('institution-guidance-from-answers.selfcheck: ok')
