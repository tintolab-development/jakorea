import assert from 'node:assert/strict'
import { UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS } from '@jakorea/form-schema/paragraph-ids/ujat-program-application-form-volunteer-draft'
import { buildUjatVolunteerApplicationProfileFromAnswers } from './ujat-volunteer-application-content-from-answers.ts'

const overlay = buildUjatVolunteerApplicationProfileFromAnswers({
  'ujatVolunteerApplication.preferredRegion': '서울',
  'ujatVolunteerApplication.universityName': '한국대학교',
  'ujatVolunteerApplication.grade': '2',
  'ujatVolunteerApplication.major': '경영학',
  'ujatVolunteerApplication.hasExperience': 'yes',
  'ujatVolunteerApplication.applicationRoute': 'instagram',
})
assert.equal(overlay?.preferredRegion, '서울')
assert.equal(overlay?.universityName, '한국대학교')
assert.equal(overlay?.gradeLabel, '2학년')
assert.equal(overlay?.major, '경영학')
assert.equal(overlay?.educationExperienceLabel, '있음')
assert.equal(overlay?.applicationRouteLabel, '인스타그램')

const nested = buildUjatVolunteerApplicationProfileFromAnswers({
  [UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.preferredRegion]:
    'ujat-program-application-volunteer-preferred-region-busan',
  [UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.basicInfo]: {
    universityName: '부산대학교',
    grade: 'leave',
    major: '교육학',
    applicationRoute: 'other',
    applicationRouteOther: '학과 게시판',
  },
  [UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.educationExperience]:
    'ujat-program-application-volunteer-education-experience-no',
})
assert.equal(nested?.preferredRegion, '부산')
assert.equal(nested?.universityName, '부산대학교')
assert.equal(nested?.gradeLabel, '휴학생')
assert.equal(nested?.major, '교육학')
assert.equal(nested?.educationExperienceLabel, '없음')
assert.equal(nested?.applicationRouteLabel, '학과 게시판')

assert.equal(buildUjatVolunteerApplicationProfileFromAnswers({}), undefined)

console.log('ujat-volunteer-application-content-from-answers.selfcheck: ok')
