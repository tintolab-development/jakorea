import assert from 'node:assert/strict'
import { PROGRAM_APPLICATION_FORM_ECONOMY_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-economy-draft'
import { PROGRAM_APPLICATION_FORM_INSTITUTION_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-institution-draft'
import { PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-trained-teachers-draft'
import { UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS } from '@jakorea/form-schema/paragraph-ids/ujat-program-application-form-institution-draft'
import { mapTeacherInstitutionFromApplicationAnswers } from './institution-basic-info-from-answers.ts'

const institutionKey = PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.basicInfo
const trainedKey = PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS.basicInfo
const economyKey = PROGRAM_APPLICATION_FORM_ECONOMY_IDS.basicInfo
const ujatKey = UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.basicInfo

const answers = {
  [institutionKey]: {
    schoolName: 'QA 제휴학교',
    applicationGrade: '2',
    regionLabel: '서울특별시 강서구 마곡중앙8로 71',
    addressDetail: 'QA2323',
    classCount: 1,
    studentCount: 2,
    teacherName: '이가원',
    teacherTel: '02-1234-5678',
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
assert.equal(
  institution!.teacherContact,
  '이가원 | 02-1234-5678 | 010-4915-9154 | 0915lgw@tinto.co.kr',
)
assert.ok(!institution!.teacherContact.includes('*'), 'Portal 본인 상세는 마스킹 없이 원문 표시')
assert.equal(institution!.preferredEducationForm, undefined)
assert.equal(institution!.venue, undefined)

const answersWithPreferred = {
  [institutionKey]: {
    ...answers[institutionKey],
    educationFormat: 'online',
    educationPlace: 'inside',
  },
}
const withPreferred = mapTeacherInstitutionFromApplicationAnswers(answersWithPreferred, 'general')
assert.equal(withPreferred!.preferredEducationForm, '온라인')
assert.equal(withPreferred!.venue, '기관 안')

const trainedAnswers = {
  [trainedKey]: {
    schoolName: '부명초등학교',
    applicationGrade: '1',
    regionLabel: '경기도 부천시 조마루로 200',
    addressDetail: '교무실',
    classCount: 2,
    studentCount: 12,
    teacherName: '교육받은교사테스트',
    teacherTel: '010-1234-5678',
    teacherMobile: '010-9876-5432',
    teacherEmail: 'tt.teacher@test.com',
    applicationReason: '신청 사유',
    otherRequests: '기타',
  },
}
const trained = mapTeacherInstitutionFromApplicationAnswers(
  trainedAnswers,
  'general',
  'TRAINED_TEACHER',
)
assert.equal(
  trained!.teacherContact,
  '교육받은교사테스트 | 010-1234-5678 | 010-9876-5432 | tt.teacher@test.com',
)

const economyOnly = {
  [economyKey]: {
    schoolName: '경제교육학교',
    applicationGrade: '3',
    regionLabel: '서울',
    addressDetail: '본관',
    classCount: 1,
    studentCount: 10,
    teacherName: '경제교사',
    teacherTel: '02-1111-2222',
    teacherMobile: '010-1111-2222',
    teacherEmail: 'economy@test.com',
    applicationReason: '사유',
    otherRequests: '',
  },
}
const economy = mapTeacherInstitutionFromApplicationAnswers(economyOnly, 'gemini')
assert.equal(economy!.teacherContact, '경제교사 | 02-1111-2222 | 010-1111-2222 | economy@test.com')

const ujatOnly = {
  [ujatKey]: {
    schoolName: 'UJAT학교',
    applicationGrade: '4',
    regionLabel: '인천',
    addressDetail: '교무실',
    classCount: 1,
    studentCount: 20,
    teacherName: 'UJAT교사',
    teacherTel: '032-123-4567',
    teacherMobile: '010-2222-3333',
    teacherEmail: 'ujat@test.com',
    applicationReason: '사유',
    otherRequests: '',
  },
}
const ujat = mapTeacherInstitutionFromApplicationAnswers(ujatOnly, 'ujat-participant')
assert.equal(ujat!.teacherContact, 'UJAT교사 | 032-123-4567 | 010-2222-3333 | ujat@test.com')

/** preferred key 없을 때 다른 seed basic-info로 fallback */
const fallback = mapTeacherInstitutionFromApplicationAnswers(economyOnly, 'general')
assert.equal(fallback!.name, '경제교육학교')

const geminiAnswers = {
  'gemini-vt-inst-seed-training-info': { studentCount: 20 },
  'gemini-vt-inst-seed-contact': { teacherName: '김교사', jobTitle: '교사', subject: '사회' },
  schoolName: '서울초등학교',
  applicationGrade: '3',
  regionLabel: '서울특별시 강서구',
  addressDetail: '본관',
}
const gemini = mapTeacherInstitutionFromApplicationAnswers(geminiAnswers, 'gemini')
assert.equal(gemini!.name, '서울초등학교')
assert.equal(gemini!.grade, '3학년')
assert.equal(gemini!.address, '서울특별시 강서구')
assert.equal(gemini!.addressDetail, '본관')
assert.equal(gemini!.jobTitle, '교사')
assert.equal(gemini!.studentCount, '20명')
assert.ok(gemini!.teacherContact.includes('김교사'))
assert.notEqual(gemini!.jobTitle, '김교사')

const geminiShifted = mapTeacherInstitutionFromApplicationAnswers(
  {
    'gemini-vt-inst-seed-training-info': { studentCount: 15 },
    'gemini-vt-inst-seed-contact': { teacherName: '김교사', jobTitle: '김교사' },
  },
  'gemini',
)
assert.equal(geminiShifted!.jobTitle, undefined)
assert.ok(geminiShifted!.teacherContact.includes('김교사'))

const geminiLabeled = mapTeacherInstitutionFromApplicationAnswers(
  {
    'gemini-vt-inst-seed-training-info': {
      studentCount: 20,
      dataRows: [
        ['기관명', '서울초등학교'],
        ['학년', '3'],
        ['소재지', '서울특별시 강서구'],
        ['상세주소', '본관'],
        ['학급', 2],
      ],
    },
    'gemini-vt-inst-seed-contact': { name: '김교사', jobTitle: '교사' },
  },
  'gemini',
)
assert.equal(geminiLabeled!.name, '서울초등학교')
assert.equal(geminiLabeled!.grade, '3학년')
assert.equal(geminiLabeled!.address, '서울특별시 강서구')
assert.equal(geminiLabeled!.addressDetail, '본관')
assert.equal(geminiLabeled!.classAndHeadcount, '2개 학급 | 총 20명')
assert.equal(geminiLabeled!.jobTitle, '교사')
assert.ok(geminiLabeled!.teacherContact.includes('김교사'))

const geminiNested = mapTeacherInstitutionFromApplicationAnswers(
  {
    application: {
      gemini: {
        inst: {
          institutionName: '승인된 기관',
          grade: '2',
          address: '서울 강서구',
          addressDetail: '3층',
        },
      },
    },
    'gemini-vt-inst-seed-contact': { teacherName: '담당교사' },
  },
  'gemini',
)
assert.equal(geminiNested!.name, '승인된 기관')
assert.equal(geminiNested!.grade, '2학년')
assert.equal(geminiNested!.addressDetail, '3층')
assert.ok(geminiNested!.teacherContact.includes('담당교사'))

console.log('institution-basic-info-from-answers.selfcheck: ok')
