/**
 * Portal 기관 신청 POST 직전 answers 스냅샷 — PII 미포함, sidecar type 유지
 * 실행: pnpm --filter platform test
 */
import assert from 'node:assert/strict'
import { PROGRAM_APPLICATION_FORM_INSTITUTION_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-institution-draft'
import { summarizePortalApplicationSubmit } from './summarize-portal-application-submit.ts'

const IDS = PROGRAM_APPLICATION_FORM_INSTITUTION_IDS

const requestAnswers = {
  [IDS.personalInfoCollection]: {
    fieldDataRows: [[{ kind: 'text', value: '이름, 학교명, 학교 소재지, 개인 연락처, 이메일' }]],
    dataRows: [['', '', '']],
    bottomConsent: 'agree',
  },
  [IDS.thirdPartyConsent]: {
    fieldDataRows: [[{ kind: 'text', value: 'JA코리아' }]],
    dataRows: [['JA코리아', '', '', '']],
    bottomConsent: 'agree',
  },
  [IDS.basicInfo]: {
    dataRows: [['', '']],
  },
  [IDS.sexOffenseConsentSubmissionRequest]: {
    submissionRequest: 'request',
  },
  [IDS.sexOffenseConsentInquiryMethod]: {
    inquiryMethod: 'criminal_record_site',
    siteSubmission: 'online',
    institutionId: '22212',
    verificationNumber: '33233',
  },
  [IDS.scheduleChoice]: ['line:0', 'line:1'],
}

const snapshot = summarizePortalApplicationSubmit({
  programId: 186234,
  templateVersionId: 1535,
  body: {
    recruitmentId: 186563,
    formBindingId: 188632,
    applicationType: 'ORGANIZATION',
    answers: requestAnswers,
  },
})

assert.equal(snapshot.programId, 186234)
assert.equal(snapshot.recruitmentId, 186563)
assert.equal(snapshot.formBindingId, 188632)
assert.equal(snapshot.templateVersionId, 1535)
assert.equal(snapshot.applicationType, 'ORGANIZATION')
assert.equal(snapshot.guidanceIncluded, false)
assert.deepEqual(snapshot.schedule, ['line:0', 'line:1'])
assert.equal(snapshot.answerTypes[IDS.personalInfoCollection], 'object')
assert.equal(snapshot.answerTypes[IDS.thirdPartyConsent], 'object')
assert.equal(snapshot.answerTypes[IDS.basicInfo], 'object')
assert.equal(snapshot.answerTypes[IDS.sexOffenseConsentSubmissionRequest], 'object')
assert.equal(snapshot.answerTypes[IDS.sexOffenseConsentInquiryMethod], 'object')
assert.equal(snapshot.answerTypes[IDS.scheduleChoice], 'array')
assert.equal(snapshot.submissionType, 'object')
assert.equal(snapshot.inquiryType, 'object')
assert.equal(snapshot.inquiryIncluded, true)
assert.equal(snapshot.inquiryFieldsPresent, true)
assert.equal(snapshot.submissionRequest, 'request')
assert.equal(IDS.guidance in requestAnswers, false)

const serialized = JSON.stringify(snapshot)
assert.equal(serialized.includes('22212'), false)
assert.equal(serialized.includes('33233'), false)
assert.equal(serialized.includes('이름, 학교명'), false)
assert.equal(serialized.includes('institution-schedule-slot-1'), false)

const noSubmitSnapshot = summarizePortalApplicationSubmit({
  programId: 186234,
  templateVersionId: 1535,
  body: {
    recruitmentId: 186563,
    formBindingId: 188632,
    applicationType: 'ORGANIZATION',
    answers: {
      [IDS.sexOffenseConsentSubmissionRequest]: { submissionRequest: 'no_submit' },
      [IDS.scheduleChoice]: ['line:0'],
    },
  },
})
assert.equal(noSubmitSnapshot.inquiryIncluded, false)
assert.equal(noSubmitSnapshot.inquiryType, 'undefined')
assert.equal(noSubmitSnapshot.guidanceIncluded, false)
assert.equal(noSubmitSnapshot.submissionRequest, 'no_submit')

console.log('summarize-portal-application-submit.selfcheck: ok')
