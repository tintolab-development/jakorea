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
import { PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-trained-teachers-draft'
import { UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS } from '@jakorea/form-schema/paragraph-ids/ujat-program-application-form-institution-draft'
import { UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS } from '@jakorea/form-schema/paragraph-ids/ujat-program-application-form-volunteer-draft'
import {
  ECONOMY_REGISTRATION_FIXTURES,
  GENERAL_REGISTRATION_FIXTURES,
  GEMINI_RECRUITMENT_FIXTURES,
  TRAINED_TEACHERS_REGISTRATION_FIXTURES,
  UJAT_PARTICIPANT_FIXTURE,
  UJAT_VOLUNTEER_FIXTURE,
} from './cms-registration-fixtures.ts'
import { mapCmsProgramToPlatformDetail } from './map-from-cms.ts'
import { PROGRAM_DETAIL_CASE_SSOT_IDS } from './detail-case.ts'
import {
  buildApplyFormSeedDraft,
  getApplicationTemplateCodeForApplyCase,
  PROGRAM_APPLY_FORM_CASE_SSOT_IDS,
  resolveProgramApplyFormCase,
} from './apply-form-drafts.ts'

function paragraphIds(programId: string, extra?: { participationMethod?: 'individual' | 'team' }) {
  const fixture =
    GENERAL_REGISTRATION_FIXTURES.find(f => f.id === programId) ??
    ECONOMY_REGISTRATION_FIXTURES.find(f => f.id === programId) ??
    GEMINI_RECRUITMENT_FIXTURES.find(f => f.id === programId) ??
    TRAINED_TEACHERS_REGISTRATION_FIXTURES.find(f => f.id === programId) ??
    (programId === UJAT_VOLUNTEER_FIXTURE.id
      ? UJAT_VOLUNTEER_FIXTURE
      : programId === UJAT_PARTICIPANT_FIXTURE.id
        ? UJAT_PARTICIPANT_FIXTURE
        : null)
  assert.ok(fixture, `fixture missing: ${programId}`)
  const detail = mapCmsProgramToPlatformDetail(fixture)
  if (extra?.participationMethod) {
    detail.participationMethod = extra.participationMethod
  }
  const applyCase = resolveProgramApplyFormCase(detail)
  const draft = buildApplyFormSeedDraft(detail)
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
    getApplicationTemplateCodeForApplyCase('ujat-volunteer'),
    'application-ujat-volunteer'
  )
  assert.equal(
    getApplicationTemplateCodeForApplyCase('institution-general'),
    'application-participant-school'
  )
  assert.equal(
    getApplicationTemplateCodeForApplyCase('institution-ujat'),
    'application-ujat-school'
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
  assert.equal(
    getApplicationTemplateCodeForApplyCase('trained-teachers'),
    'application-trained-teachers'
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
  assert.equal(applyCase, 'ujat-volunteer')
  assert.equal(templateCode, 'application-ujat-volunteer')
  assert.deepEqual(ids, [
    UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.personalInfoCollection,
    UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.thirdPartyConsent,
    UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.basicInfo,
    UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.previousTerm,
    UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.preferredRegion,
    UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.educationExperience,
    UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.interviewSchedule,
    UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.freeTextItems,
    UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.submitConfirmation,
  ])
}

function testInstitutionUjat() {
  const { applyCase, templateCode, ids } = paragraphIds(
    PROGRAM_APPLY_FORM_CASE_SSOT_IDS.institutionUjat
  )
  assert.equal(applyCase, 'institution-ujat')
  assert.equal(templateCode, 'application-ujat-school')
  assert.deepEqual(ids, [
    UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.personalInfoCollection,
    UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.thirdPartyConsent,
    UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.applicationRegion,
    UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.basicInfo,
    UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.gradeApplicationInfo,
    UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.gradeClassTime,
    UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.preferredEducationSchedule,
    UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.submitConfirmation,
  ])
}

function testInstitutionGeneral() {
  const { applyCase, templateCode, ids, detail } = paragraphIds(
    PROGRAM_APPLY_FORM_CASE_SSOT_IDS.institutionGeneral
  )
  assert.equal(applyCase, 'institution-general')
  assert.equal(templateCode, 'application-participant-school')
  assert.equal(detail.educationScheduleMode, 'date')
  assert.equal(detail.educationScheduleLines.length, 2)
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

  const draft = buildApplyFormSeedDraft(detail)
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
  assert.deepEqual(
    schedule.items.map(item => item.id),
    detail.educationScheduleLines.map((_, index) => `line:${index}`)
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
  const geminiDraft = buildApplyFormSeedDraft(
    mapCmsProgramToPlatformDetail(
      GEMINI_RECRUITMENT_FIXTURES.find(f => f.id === PROGRAM_DETAIL_CASE_SSOT_IDS.gemini)!
    )
  )
  assert.ok(geminiDraft)
  const titles = Object.fromEntries(
    geminiDraft!.paragraphs.map(paragraph => [paragraph.id, paragraph.paragraphTitle])
  )
  assert.equal(
    titles[GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTITUTION_IDS.personalInfoCollection],
    '개인정보 수집‧이용'
  )
  assert.equal(
    titles[GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTITUTION_IDS.thirdPartyConsent],
    '제3자 정보 제공‧이용 동의'
  )
  assert.equal(
    titles[GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTITUTION_IDS.portraitConsent],
    '초상권 수집·이용 동의'
  )
  assert.equal(
    titles[GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTITUTION_IDS.trainingInfo],
    '연수 정보'
  )
  assert.equal(
    titles[GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTITUTION_IDS.contactPerson],
    '담당 교사 정보'
  )
  const schedule = geminiDraft!.paragraphs.find(
    paragraph =>
      paragraph.id ===
      GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTITUTION_IDS.preferredEducationSchedule
  )
  assert.equal(schedule?.paragraphTitle, '진행 희망 교육 일정')
  assert.equal(
    schedule?.paragraphDescription,
    '1~3순위 희망 날짜 및 교육 시간을 기재해 주세요.'
  )
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
    GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTRUCTOR_IDS.officialDocument,
    GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTRUCTOR_IDS.availableSchedule,
  ])
}

function testTrainedTeachers() {
  const { applyCase, templateCode, ids, detail } = paragraphIds(
    PROGRAM_APPLY_FORM_CASE_SSOT_IDS.trainedTeachers
  )
  assert.equal(detail.registrationKind, 'trainedTeachers')
  assert.equal(detail.programType, 'TRAINED_TEACHER')
  assert.equal(applyCase, 'trained-teachers')
  assert.equal(templateCode, 'application-trained-teachers')
  assert.deepEqual(ids, [
    PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS.personalInfoCollection,
    PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS.thirdPartyConsent,
    PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS.basicInfo,
    PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS.preferredSchedule,
  ])
  // instructor 시드(성범죄·강의 가능 일정)로 폴백되면 안 됨
  assert.equal(
    ids.some(id => id.includes('application-instructor')),
    false,
  )
}

function testTrainedTeachersProgramTypeRouting() {
  const detail = mapCmsProgramToPlatformDetail(
    TRAINED_TEACHERS_REGISTRATION_FIXTURES.find(
      f => f.id === PROGRAM_APPLY_FORM_CASE_SSOT_IDS.trainedTeachers
    )!
  )
  assert.equal(resolveProgramApplyFormCase(detail), 'trained-teachers')
  assert.equal(
    resolveProgramApplyFormCase({
      id: '186012',
      category: 'instructor',
      detailCase: 'instructor',
      programType: 'TRAINED_TEACHER',
    }),
    'trained-teachers'
  )
}

function testEconomyProgramTypeRouting() {
  assert.equal(
    resolveProgramApplyFormCase({
      id: '186092',
      category: 'institution',
      programType: 'ONE_COMPANY_ONE_SCHOOL',
      applicationType: 'ORGANIZATION',
      programAudience: 'organization',
      participationMethod: 'individual',
    }),
    'institution-economy',
  )
}

function run() {
  testCaseToTemplateCode()
  testIndividualGeneral()
  testIndividualTeam()
  testVolunteer()
  testInstitutionUjat()
  testInstitutionGeneral()
  testScheduleSingleDateUsesRegisteredLines()
  testScheduleMultiHidesScheduleChoice()
  testInstitutionEconomy()
  testInstitutionGemini()
  testGeminiDetailCaseRouting()
  testInstructorGemini()
  testTrainedTeachers()
  testTrainedTeachersProgramTypeRouting()
  testEconomyProgramTypeRouting()
  console.log(
    'apply-form-drafts: all checks passed (apply cases × CMS templateCode seed paragraphs)'
  )
}

run()
