import assert from 'node:assert/strict'
import { PROGRAM_APPLICATION_FORM_ECONOMY_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-economy-draft'
import { PROGRAM_PARTICIPANT_APPLICATION_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-individual-draft'
import { PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-instructor-draft'
import { PROGRAM_APPLICATION_FORM_INSTITUTION_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-institution-draft'
import { PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-trained-teachers-draft'
import { UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS } from '@jakorea/form-schema/paragraph-ids/ujat-program-application-form-institution-draft'
import {
  isApplicationBasicInfoParagraphId,
  isApplicationGuidanceParagraphId,
  isApplicationPreferredScheduleParagraphId,
  isApplicationSexOffenseInquiryParagraphId,
  isApplicationSexOffenseSubmissionParagraphId,
  isApplicationTeamInfoParagraphId,
  isDynamicIndividualInterviewParagraph,
  isDynamicVolunteerActivityScheduleParagraph,
  isDynamicVolunteerInterviewParagraph,
  isInstructorAvailableScheduleParagraphId,
  isInstructorCrimeRecordParagraphId,
  isUjatInstitutionBasicInfoParagraphId,
  isUjatInstitutionClassTimeParagraphId,
  isUjatInstitutionGradeInfoParagraphId,
  isUjatInstitutionPreferredScheduleParagraphId,
  isUjatSubmitConfirmationParagraphId,
  shouldLockTeacherMobileEmailOnBasicInfo,
  shouldShowEducationPlaceOnBasicInfo,
} from './apply-form-paragraph-ids.ts'

assert.equal(
  isApplicationBasicInfoParagraphId(PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.basicInfo),
  true,
)
assert.equal(
  isApplicationBasicInfoParagraphId(PROGRAM_APPLICATION_FORM_ECONOMY_IDS.basicInfo),
  true,
)
assert.equal(
  isApplicationBasicInfoParagraphId(PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS.basicInfo),
  true,
)
assert.equal(
  isApplicationTeamInfoParagraphId(PROGRAM_PARTICIPANT_APPLICATION_IDS.teamInfo),
  true,
)
assert.equal(
  isApplicationGuidanceParagraphId(PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.guidance),
  true,
)
assert.equal(
  isApplicationSexOffenseSubmissionParagraphId(
    PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.sexOffenseConsentSubmissionRequest,
  ),
  true,
)
assert.equal(
  isApplicationSexOffenseInquiryParagraphId(
    PROGRAM_APPLICATION_FORM_ECONOMY_IDS.sexOffenseConsentInquiryMethod,
  ),
  true,
)
assert.equal(
  isApplicationPreferredScheduleParagraphId(PROGRAM_APPLICATION_FORM_ECONOMY_IDS.preferredSchedule),
  true,
)
assert.equal(
  shouldShowEducationPlaceOnBasicInfo(PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.basicInfo),
  false,
)
assert.equal(
  shouldLockTeacherMobileEmailOnBasicInfo(PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.basicInfo),
  true,
)
assert.equal(
  shouldLockTeacherMobileEmailOnBasicInfo(PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS.basicInfo),
  false,
)
assert.equal(
  shouldShowEducationPlaceOnBasicInfo(PROGRAM_APPLICATION_FORM_ECONOMY_IDS.basicInfo),
  true,
)
assert.equal(
  isInstructorCrimeRecordParagraphId(PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS.crimeRecord),
  true,
)
assert.equal(
  isInstructorAvailableScheduleParagraphId(
    PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS.availableSchedule,
  ),
  true,
)

const interviewId = 'program-participant-application-seed-interview-schedule'
assert.equal(
  isDynamicIndividualInterviewParagraph({
    id: interviewId,
    runtimeInputMode: 'dynamic_interview_slots',
    runtimeResolved: true,
    runtimeHidden: null,
  }),
  true,
)
assert.equal(isDynamicIndividualInterviewParagraph({ id: interviewId }), false)
assert.equal(
  isDynamicIndividualInterviewParagraph({
    id: interviewId,
    runtimeInputMode: 'dynamic_interview_slots',
    runtimeHidden: true,
  }),
  false,
)
assert.equal(
  isDynamicIndividualInterviewParagraph({
    id: 'program-volunteer-application-seed-interview-schedule',
    runtimeInputMode: 'dynamic_interview_slots',
  }),
  false,
)

assert.equal(
  isDynamicVolunteerInterviewParagraph({
    id: 'program-volunteer-application-seed-interview-schedule',
    runtimeInputMode: 'dynamic_interview_slots',
  }),
  true,
)
assert.equal(
  isDynamicVolunteerInterviewParagraph({
    id: 'program-volunteer-application-seed-interview-schedule',
    runtimeResolved: true,
    items: [{ id: 'interview-option:2026-10-13T10:00-10:30', label: '10:00~10:30' }],
  }),
  true,
)
assert.equal(
  isDynamicVolunteerActivityScheduleParagraph({
    id: 'program-volunteer-application-seed-activity-schedule',
    items: [{ id: 'schedule:186668', label: '일정' }],
  }),
  true,
)
assert.equal(
  isDynamicVolunteerInterviewParagraph({
    id: interviewId,
    runtimeInputMode: 'dynamic_interview_slots',
  }),
  false,
)
assert.equal(
  isDynamicVolunteerInterviewParagraph({
    id: 'ujat-program-application-volunteer-seed-interview-schedule',
    runtimeInputMode: 'dynamic_interview_slots',
  }),
  true,
)
assert.equal(
  isDynamicVolunteerInterviewParagraph({
    id: 'ujat-program-application-volunteer-seed-interview-schedule',
    runtimeInputMode: 'dynamic_interview_slots',
    runtimeHidden: true,
  }),
  false,
)

assert.equal(
  isUjatInstitutionBasicInfoParagraphId(UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.basicInfo),
  true,
)
assert.equal(
  isApplicationBasicInfoParagraphId(UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.basicInfo),
  false,
)
assert.equal(
  isUjatInstitutionGradeInfoParagraphId(
    UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.gradeApplicationInfo,
  ),
  true,
)
assert.equal(
  isUjatInstitutionClassTimeParagraphId(UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.gradeClassTime),
  true,
)
assert.equal(
  isUjatInstitutionPreferredScheduleParagraphId(
    UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.preferredEducationSchedule,
  ),
  true,
)
assert.equal(
  isUjatSubmitConfirmationParagraphId(
    UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.submitConfirmation,
  ),
  true,
)

console.log('apply-form-paragraph-ids.selfcheck: ok')
