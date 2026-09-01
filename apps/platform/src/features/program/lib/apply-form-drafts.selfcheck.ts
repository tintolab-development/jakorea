/**
 * 신청 폼 6케이스 — CMS templateCode 연동 mock draft 단락 인벤토리 검증.
 * 실행: pnpm --filter platform test
 */

import assert from 'node:assert/strict'
import { PROGRAM_APPLICATION_FORM_ECONOMY_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-economy-draft'
import { GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTITUTION_IDS } from '@jakorea/form-schema/paragraph-ids/gemini-visiting-training-application-form-institution-draft'
import { GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTRUCTOR_IDS } from '@jakorea/form-schema/paragraph-ids/gemini-visiting-training-application-form-instructor-draft'
import { PROGRAM_PARTICIPANT_APPLICATION_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-individual-draft'
import { PROGRAM_APPLICATION_FORM_INSTITUTION_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-institution-draft'
import { PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-volunteer-draft'
import {
  ECONOMY_REGISTRATION_FIXTURES,
  GENERAL_REGISTRATION_FIXTURES,
  GEMINI_RECRUITMENT_FIXTURES,
  UJAT_VOLUNTEER_FIXTURE,
} from './cms-registration-fixtures.ts'
import { mapCmsProgramToPlatformDetail } from './map-from-cms.ts'
import { PROGRAM_DETAIL_CASE_SSOT_IDS } from './detail-case.ts'
import {
  getApplicationTemplateCodeForApplyCase,
  getMockApplyFormDraft,
  PROGRAM_APPLY_FORM_CASE_SSOT_IDS,
  resolveProgramApplyFormCase,
} from './apply-form-drafts.ts'

function paragraphIds(programId: string, extra?: { participationMethod?: 'individual' | 'team' }) {
  const fixture =
    GENERAL_REGISTRATION_FIXTURES.find(f => f.id === programId) ??
    ECONOMY_REGISTRATION_FIXTURES.find(f => f.id === programId) ??
    GEMINI_RECRUITMENT_FIXTURES.find(f => f.id === programId) ??
    (programId === UJAT_VOLUNTEER_FIXTURE.id ? UJAT_VOLUNTEER_FIXTURE : null)
  assert.ok(fixture, `fixture missing: ${programId}`)
  const detail = mapCmsProgramToPlatformDetail(fixture)
  if (extra?.participationMethod) {
    detail.participationMethod = extra.participationMethod
  }
  const applyCase = resolveProgramApplyFormCase(detail)
  const draft = getMockApplyFormDraft(detail)
  assert.ok(draft, `apply draft missing: ${programId}`)
  return {
    applyCase,
    templateCode: getApplicationTemplateCodeForApplyCase(applyCase),
    ids: draft.paragraphs.map(p => p.id) as string[],
    detail,
  }
}

function testCaseToTemplateCode() {
  assert.equal(
    getApplicationTemplateCodeForApplyCase('individual-general'),
    'application-participant-individual'
  )
  assert.equal(
    getApplicationTemplateCodeForApplyCase('individual-team'),
    'application-participant-individual'
  )
  assert.equal(
    getApplicationTemplateCodeForApplyCase('individual-volunteer'),
    'application-volunteer'
  )
  assert.equal(
    getApplicationTemplateCodeForApplyCase('institution-general'),
    'application-participant-school'
  )
  assert.equal(
    getApplicationTemplateCodeForApplyCase('institution-economy'),
    'application-economy'
  )
  assert.equal(
    getApplicationTemplateCodeForApplyCase('institution-gemini'),
    'application-gemini-visiting-training-school'
  )
  assert.equal(
    getApplicationTemplateCodeForApplyCase('instructor-gemini'),
    'application-gemini-visiting-training-instructor'
  )
}

function testIndividualGeneral() {
  const { applyCase, templateCode, ids, detail } = paragraphIds(
    PROGRAM_APPLY_FORM_CASE_SSOT_IDS.individualGeneral
  )
  assert.equal(detail.participationMethod, 'individual')
  assert.equal(applyCase, 'individual-general')
  assert.equal(templateCode, 'application-participant-individual')
  assert.equal(ids.includes(PROGRAM_PARTICIPANT_APPLICATION_IDS.teamInfo), false)
  assert.deepEqual(ids, [
    PROGRAM_PARTICIPANT_APPLICATION_IDS.personalInfoCollection,
    PROGRAM_PARTICIPANT_APPLICATION_IDS.thirdPartyConsent,
    PROGRAM_PARTICIPANT_APPLICATION_IDS.selfIntro,
    PROGRAM_PARTICIPANT_APPLICATION_IDS.scheduleChoice,
  ])
}

function testIndividualTeam() {
  const { applyCase, templateCode, ids, detail } = paragraphIds(
    PROGRAM_APPLY_FORM_CASE_SSOT_IDS.individualTeam
  )
  assert.equal(detail.participationMethod, 'team')
  assert.equal(applyCase, 'individual-team')
  assert.equal(templateCode, 'application-participant-individual')
  assert.deepEqual(ids, [
    PROGRAM_PARTICIPANT_APPLICATION_IDS.personalInfoCollection,
    PROGRAM_PARTICIPANT_APPLICATION_IDS.thirdPartyConsent,
    PROGRAM_PARTICIPANT_APPLICATION_IDS.selfIntro,
    PROGRAM_PARTICIPANT_APPLICATION_IDS.teamInfo,
    PROGRAM_PARTICIPANT_APPLICATION_IDS.scheduleChoice,
  ])
}

function testVolunteer() {
  const { applyCase, templateCode, ids } = paragraphIds(
    PROGRAM_APPLY_FORM_CASE_SSOT_IDS.individualVolunteer
  )
  assert.equal(applyCase, 'individual-volunteer')
  assert.equal(templateCode, 'application-volunteer')
  assert.deepEqual(ids, [
    PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.personalInfoCollection,
    PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.thirdPartyConsent,
    PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.jaVolunteerExperience,
    PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.previousJaProgram,
    PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.freeTextItems,
    PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.interviewSchedule,
  ])
}

function testInstitutionGeneral() {
  const { applyCase, templateCode, ids } = paragraphIds(
    PROGRAM_APPLY_FORM_CASE_SSOT_IDS.institutionGeneral
  )
  assert.equal(applyCase, 'institution-general')
  assert.equal(templateCode, 'application-participant-school')
  assert.deepEqual(ids, [
    PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.personalInfoCollection,
    PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.thirdPartyConsent,
    PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.basicInfo,
    PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.guidance,
    PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.sexOffenseConsentSubmissionRequest,
    PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.sexOffenseConsentInquiryMethod,
    PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.scheduleChoice,
  ])
}

function testScheduleSingleDateUsesRegisteredLines() {
  const fixture = GENERAL_REGISTRATION_FIXTURES.find(
    f => f.id === 'general-prog-type-ind-schedule-single'
  )
  assert.ok(fixture)
  const detail = mapCmsProgramToPlatformDetail(fixture)
  assert.equal(detail.educationStructure, 'schedule')
  assert.equal(detail.sessionRound, 'single')
  assert.equal(detail.educationScheduleMode, 'date')
  assert.ok(detail.educationScheduleLines.length > 0)

  const draft = getMockApplyFormDraft(detail)
  const schedule = draft.paragraphs.find(
    p => p.id === PROGRAM_PARTICIPANT_APPLICATION_IDS.scheduleChoice
  )
  assert.ok(schedule)
  assert.equal(schedule.kind, 'single_item')
  if (schedule.kind !== 'single_item' || schedule.variant !== 'multiple_choice') {
    assert.fail('scheduleChoice must be multiple_choice')
    return
  }
  assert.deepEqual(
    schedule.items.map(item => item.label),
    detail.educationScheduleLines
  )
}

function testScheduleMultiHidesScheduleChoice() {
  const orgMulti = paragraphIds('general-prog-type-org-schedule-multi')
  assert.equal(orgMulti.applyCase, 'institution-general')
  assert.equal(orgMulti.ids.includes(PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.scheduleChoice), false)

  const indMulti = paragraphIds('general-prog-type-ind-schedule-multi')
  assert.equal(indMulti.applyCase, 'individual-general')
  assert.equal(indMulti.ids.includes(PROGRAM_PARTICIPANT_APPLICATION_IDS.scheduleChoice), false)
}

function testInstitutionEconomy() {
  const { applyCase, templateCode, ids } = paragraphIds(
    PROGRAM_APPLY_FORM_CASE_SSOT_IDS.institutionEconomy
  )
  assert.equal(applyCase, 'institution-economy')
  assert.equal(templateCode, 'application-economy')
  assert.ok(ids.includes(PROGRAM_APPLICATION_FORM_ECONOMY_IDS.lessonReply))
  assert.ok(ids.includes(PROGRAM_APPLICATION_FORM_ECONOMY_IDS.educationExperience))
  assert.ok(ids.includes(PROGRAM_APPLICATION_FORM_ECONOMY_IDS.preferredSchedule))
  assert.ok(!ids.includes(PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.scheduleChoice))
}

function testInstitutionGemini() {
  const { applyCase, templateCode, ids } = paragraphIds(
    PROGRAM_APPLY_FORM_CASE_SSOT_IDS.institutionGemini
  )
  assert.equal(applyCase, 'institution-gemini')
  assert.equal(templateCode, 'application-gemini-visiting-training-school')
  // Gemini는 일반 기관 draft로 폴백되면 안 됨
  assert.equal(ids.includes(PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.basicInfo), false)
  assert.equal(ids.includes(PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.guidance), false)
  assert.deepEqual(ids, [
    GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTITUTION_IDS.personalInfoCollection,
    GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTITUTION_IDS.thirdPartyConsent,
    GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTITUTION_IDS.portraitConsent,
    GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTITUTION_IDS.trainingInfo,
    GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTITUTION_IDS.contactPerson,
    GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTITUTION_IDS.preferredEducationSchedule,
  ])
}

function testGeminiDetailCaseRouting() {
  const gemini = mapCmsProgramToPlatformDetail(
    GEMINI_RECRUITMENT_FIXTURES.find(f => f.id === PROGRAM_DETAIL_CASE_SSOT_IDS.gemini)!
  )
  assert.equal(gemini.detailCase, 'gemini')
  assert.equal(resolveProgramApplyFormCase(gemini), 'institution-gemini')
}

function testInstructorGemini() {
  const { applyCase, templateCode, ids, detail } = paragraphIds(
    PROGRAM_APPLY_FORM_CASE_SSOT_IDS.instructorGemini
  )
  assert.equal(detail.detailCase, 'instructor')
  assert.equal(applyCase, 'instructor-gemini')
  assert.equal(templateCode, 'application-gemini-visiting-training-instructor')
  assert.deepEqual(ids, [
    GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTRUCTOR_IDS.availableSchedule,
    GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTRUCTOR_IDS.officialDocument,
  ])
}

function run() {
  testCaseToTemplateCode()
  testIndividualGeneral()
  testIndividualTeam()
  testVolunteer()
  testInstitutionGeneral()
  testScheduleSingleDateUsesRegisteredLines()
  testScheduleMultiHidesScheduleChoice()
  testInstitutionEconomy()
  testInstitutionGemini()
  testGeminiDetailCaseRouting()
  testInstructorGemini()
  console.log(
    'apply-form-drafts: all checks passed (apply cases × CMS templateCode seed paragraphs)'
  )
}

run()
