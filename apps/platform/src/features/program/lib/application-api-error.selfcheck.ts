/**
 * 봉사자 모집 대상 불일치(403)는 서버 영문 메시지 대신 고정 한글 안내를 쓴다.
 */
import assert from 'node:assert/strict'
import { AxiosError } from 'axios'
import {
  getApiErrorMessageFromBody,
  getApplicationApiErrorCode,
  getProgramApplicationApiErrorMessage,
  isIndividualApplicationEnrolledGradeRequiredError,
  messageForApplicationBlockedReason,
} from './application-api-error.ts'
import { readApplicationApiErrorEnvelope } from './summarize-portal-application-submit.ts'

const MISMATCH = '모집 대상과 회원 구분이 일치하지 않아 신청할 수 없습니다.'

function axiosErr(data: unknown) {
  return new AxiosError('Request failed', undefined, undefined, undefined, {
    status: 403,
    data,
    statusText: 'Forbidden',
    headers: {},
    config: {} as never,
  })
}

const mismatchBody = {
  success: false,
  message: MISMATCH,
  error: {
    code: 'VOLUNTEER_RECRUITMENT_TARGET_MISMATCH',
    message: MISMATCH,
  },
}

const affiliationBody = {
  success: false,
  data: null,
  message: '활성 학교·기관 소속이 필요합니다.',
  error: {
    code: 'ACTIVE_ORGANIZATION_AFFILIATION_REQUIRED',
    message: '활성 학교·기관 소속이 필요합니다.',
    field: null,
    traceId: 'test-trace',
    details: null,
  },
}

assert.equal(
  getApiErrorMessageFromBody(affiliationBody),
  '활성 학교·기관 소속이 필요합니다.',
)
assert.equal(
  getProgramApplicationApiErrorMessage(axiosErr(affiliationBody)),
  '활성 학교·기관 소속이 필요합니다.',
)
assert.equal(
  messageForApplicationBlockedReason('ACTIVE_ORGANIZATION_AFFILIATION_REQUIRED'),
  '활성 학교·기관 소속이 필요합니다.',
)
assert.equal(
  (messageForApplicationBlockedReason('UNKNOWN_FUTURE_CODE') ?? '').includes('UNKNOWN'),
  false,
)

assert.equal(messageForApplicationBlockedReason('VOLUNTEER_RECRUITMENT_TARGET_MISMATCH'), MISMATCH)
assert.equal(
  messageForApplicationBlockedReason('ORGANIZATION_MEMBERSHIP_REQUIRED'),
  '학교·기관 회원만 신청할 수 있습니다.',
)
assert.equal(
  messageForApplicationBlockedReason('COLLEGE_STUDENT_REQUIRED'),
  '대학생 모집 프로그램은 재학 중인 대학생 회원만 신청할 수 있습니다.',
)
assert.equal(messageForApplicationBlockedReason('CAPACITY_FULL'), '모집 정원이 마감되었습니다.')
assert.equal(getProgramApplicationApiErrorMessage(axiosErr(mismatchBody)), MISMATCH)
assert.equal(getApplicationApiErrorCode(axiosErr(mismatchBody)), 'VOLUNTEER_RECRUITMENT_TARGET_MISMATCH')

const enrolledGradeBody = {
  error: {
    code: 'INDIVIDUAL_APPLICATION_ENROLLED_GRADE_REQUIRED',
    message: '재학 중인 회원은 학년 정보를 등록한 후 개인 프로그램에 신청할 수 있습니다.',
  },
  message: '재학 중인 회원은 학년 정보를 등록한 후 개인 프로그램에 신청할 수 있습니다.',
}

const enrolledGradeErr = new AxiosError('Request failed', undefined, undefined, undefined, {
  status: 400,
  data: enrolledGradeBody,
  statusText: 'Bad Request',
  headers: {},
  config: {} as never,
})

assert.equal(
  getProgramApplicationApiErrorMessage(enrolledGradeErr),
  enrolledGradeBody.message,
)
assert.equal(isIndividualApplicationEnrolledGradeRequiredError(enrolledGradeErr), true)

const invalidValueBody = {
  success: false,
  data: null,
  message: '입력값 또는 요청 조건을 확인해 주세요.',
  error: {
    code: 'INVALID_VALUE',
    message: '입력값 또는 요청 조건을 확인해 주세요.',
    field: null,
    traceId: '1717d8300ae84334814cd4aeb5103204',
    details: null,
  },
}
const invalidValueErr = new AxiosError('Request failed', undefined, undefined, undefined, {
  status: 400,
  data: invalidValueBody,
  statusText: 'Bad Request',
  headers: {},
  config: {} as never,
})
assert.equal(getApplicationApiErrorCode(invalidValueErr), 'INVALID_VALUE')
assert.deepEqual(readApplicationApiErrorEnvelope(invalidValueErr), {
  code: 'INVALID_VALUE',
  message: '입력값 또는 요청 조건을 확인해 주세요.',
  field: null,
  traceId: '1717d8300ae84334814cd4aeb5103204',
  details: null,
})

console.log('application-api-error.selfcheck: ok')
