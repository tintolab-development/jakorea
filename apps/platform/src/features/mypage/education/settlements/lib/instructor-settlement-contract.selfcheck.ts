import assert from 'node:assert/strict'
import {
  INSTRUCTOR_PAYMENT_STATEMENT_CONSENT_REQUIRED_CODE,
  PAYMENT_STATEMENT_CONSENT_REQUIRED_MESSAGE,
  instructorSettlementApiErrorMessage,
  isInstructorPaymentStatementSubmit,
  isPaymentStatementConsentRequiredError,
  readInstructorSettlementErrorCode,
} from './instructor-settlement-contract.ts'

assert.equal(
  isInstructorPaymentStatementSubmit({
    applicationType: 'INSTRUCTOR',
    documentKind: 'payment_statement',
  }),
  true,
)
assert.equal(
  isInstructorPaymentStatementSubmit({
    applicationType: 'INDIVIDUAL',
    documentKind: 'payment_statement',
  }),
  false,
)
assert.equal(
  isInstructorPaymentStatementSubmit({
    applicationType: 'INSTRUCTOR',
    documentKind: 'receipt',
  }),
  false,
)

const axiosLike = Object.assign(new Error('conflict'), {
  isAxiosError: true,
  response: {
    status: 409,
    data: { error: { code: 'LECTURE_REPORT_REQUIRED' } },
  },
})
assert.equal(readInstructorSettlementErrorCode(axiosLike), 'LECTURE_REPORT_REQUIRED')
assert.equal(
  instructorSettlementApiErrorMessage(axiosLike),
  '강의보고서/강의평가 제출 이후 정산 신청이 가능합니다.',
)

const consentAxios = Object.assign(new Error('conflict'), {
  isAxiosError: true,
  response: {
    status: 409,
    data: { error: { code: INSTRUCTOR_PAYMENT_STATEMENT_CONSENT_REQUIRED_CODE } },
  },
})
assert.equal(isPaymentStatementConsentRequiredError(consentAxios), true)
assert.equal(
  instructorSettlementApiErrorMessage(consentAxios),
  PAYMENT_STATEMENT_CONSENT_REQUIRED_MESSAGE,
)

console.log('instructor-settlement-contract.selfcheck: ok')
