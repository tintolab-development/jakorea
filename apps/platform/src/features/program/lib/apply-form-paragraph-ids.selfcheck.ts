import assert from 'node:assert/strict'
import { PROGRAM_APPLICATION_FORM_ECONOMY_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-economy-draft'
import { PROGRAM_PARTICIPANT_APPLICATION_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-individual-draft'
import { PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-instructor-draft'
import { PROGRAM_APPLICATION_FORM_INSTITUTION_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-institution-draft'
import { PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-trained-teachers-draft'
import {
  isApplicationBasicInfoParagraphId,
  isApplicationGuidanceParagraphId,
  isApplicationPreferredScheduleParagraphId,
  isApplicationSexOffenseInquiryParagraphId,
  isApplicationSexOffenseSubmissionParagraphId,
  isApplicationTeamInfoParagraphId,
  isInstructorAvailableScheduleParagraphId,
  isInstructorCrimeRecordParagraphId,
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

console.log('apply-form-paragraph-ids.selfcheck: ok')
