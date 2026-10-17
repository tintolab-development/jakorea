import assert from 'node:assert/strict'
import { PROGRAM_APPLICATION_FORM_INSTITUTION_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-institution-draft'
import { mapTeacherInstitutionFromApplicationAnswers } from './institution-basic-info-from-answers.ts'

const basicKey = PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.basicInfo
const answers = {
  [basicKey]: {
    schoolName: 'QA 제휴학교',
    applicationGrade: '2',
    regionLabel: '서울특별시 강서구 마곡중앙8로 71',
    addressDetail: 'QA2323',
    classCount: 1,
    studentCount: 2,
    teacherName: '이가원',
    teacherTel: '123',
    teacherMobile: '010-4915-9154',
    teacherEmail: '0915lgw@tinto.co.kr',
    applicationReason: '신청사유33',
    otherRequests: '기타 요청사항333',
  },
}

const institution = mapTeacherInstitutionFromApplicationAnswers(answers, 'general')
assert.ok(institution)
assert.equal(institution!.name, 'QA 제휴학교')
assert.equal(institution!.grade, '2학년')
assert.equal(institution!.address, '서울특별시 강서구 마곡중앙8로 71')
assert.equal(institution!.classAndHeadcount, '1개 학급 | 총 2명')
assert.ok(institution!.teacherContact.includes('이가원'))
assert.equal(institution!.preferredEducationForm, undefined)
assert.equal(institution!.venue, undefined)

const answersWithPreferred = {
  [basicKey]: {
    ...answers[basicKey],
    educationFormat: 'online',
    educationPlace: 'inside',
  },
}
const withPreferred = mapTeacherInstitutionFromApplicationAnswers(answersWithPreferred, 'general')
assert.equal(withPreferred!.preferredEducationForm, '온라인')
assert.equal(withPreferred!.venue, '기관 안')

console.log('institution-basic-info-from-answers.selfcheck: ok')
