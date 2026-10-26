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

const contractErrorCases = [
  ['FORM_ANSWER_REQUIRED', '필수 입력값을 입력해 주세요.'],
  ['FORM_ANSWER_TYPE_INVALID', '입력 형식이 올바르지 않습니다.'],
  ['INVALID_REQUESTED_EDUCATION_FORMAT', '희망 교육 형태를 다시 확인해 주세요.'],
  ['FORM_OPTION_NOT_ALLOWED', '선택한 값은 사용할 수 없습니다.'],
  ['FORM_ANSWER_NOT_ALLOWED', '현재 제출할 수 없는 양식 항목입니다.'],
  ['RUNTIME_FORM_FIELD_NOT_ALLOWED', '현재 제출할 수 없는 양식 항목입니다.'],
  ['RUNTIME_SCHEDULE_SHAPE_INVALID', '희망 교육 일정 형식을 확인해 주세요.'],
  [
    'RUNTIME_SCHEDULE_STALE',
    '선택한 교육 일정이 변경되었습니다. 일정을 다시 선택해 주세요.',
  ],
  [
    'SCHEDULE_NOT_CONFIGURED',
    '신청 가능한 교육 일정이 설정되지 않았습니다. 관리자에게 확인해 주세요.',
  ],
  [
    'PREFERRED_SCHEDULE_OUTSIDE_EDUCATION_RANGE',
    '희망 교육 일정이 프로그램 교육 가능 기간을 벗어났습니다.',
  ],
  [
    'PREFERRED_SCHEDULE_EXCEEDS_MAX_SCHEDULE_COUNT',
    '희망 교육 일정 지망 수가 모집 상한을 초과했습니다.',
  ],
  [
    'PREFERRED_SCHEDULE_EXCEEDS_MAX_SESSIONS_PER_DAY',
    '하루 희망 차시 수가 모집 상한을 초과했습니다.',
  ],
  [
    'PREFERRED_SCHEDULE_SESSION_TIMES_REQUIRED',
    '진행 희망 교육 일정의 차시와 시간을 입력해 주세요.',
  ],
  [
    'TRAINED_TEACHER_APPLICATION_TARGET_REQUIRED',
    '교육받은 교사 프로그램은 학교·기관 신청만 가능합니다.',
  ],
  ['ASSIGNMENT_SUBMISSION_NOT_STARTED', '과제 제출 기간이 아직 시작되지 않았습니다.'],
  ['ASSIGNMENT_SUBMISSION_CLOSED', '과제 제출 기간이 종료되었습니다.'],
  ['ASSIGNMENT_SUBMISSION_NOT_ALLOWED', '해당 회차에는 과제를 제출할 수 없습니다.'],
  ['ASSIGNMENT_ALREADY_SUBMITTED', '이미 과제를 제출했습니다.'],
  ['ASSIGNMENT_RESUBMIT_NOT_ALLOWED', '과제 수정 제출이 허용되지 않습니다.'],
] as const

for (const [code, message] of contractErrorCases) {
  assert.equal(
    getApiErrorMessageFromBody({
      success: false,
      message: '입력값 또는 요청 조건을 확인해 주세요.',
      error: { code, message, field: 'test-field', details: { reason: 'debug-only' } },
    }),
    message,
  )
  assert.equal(getApiErrorMessageFromBody({ error: { code } }), message)
}

assert.equal(
  getApiErrorMessageFromBody({
    message: '입력값 또는 요청 조건을 확인해 주세요.',
    error: { code: 'FORM_ANSWER_REQUIRED', message: '필수 입력값을 입력해 주세요.' },
  }),
  '필수 입력값을 입력해 주세요.',
)
assert.equal(
  getApiErrorMessageFromBody({
    message: '입력값 또는 요청 조건을 확인해 주세요.',
    error: { code: 'FORM_ANSWER_REQUIRED' },
  }),
  '필수 입력값을 입력해 주세요.',
)
assert.equal(
  getApiErrorMessageFromBody({
    message: '입력값 또는 요청 조건을 확인해 주세요.',
    error: {
      code: 'PREFERRED_SCHEDULE_OUTSIDE_EDUCATION_RANGE',
      message: '입력값 또는 요청 조건을 확인해 주세요.',
    },
  }),
  '희망 교육 일정이 프로그램 교육 가능 기간을 벗어났습니다.',
)
assert.equal(
  getApiErrorMessageFromBody({
    message: '입력값 또는 요청 조건을 확인해 주세요.',
    error: {
      code: 'PREFERRED_SCHEDULE_SESSION_TIMES_REQUIRED',
      message: '입력값 또는 요청 조건을 확인해 주세요.',
      field: 'preferredScheduleBlocks',
    },
  }),
  '진행 희망 교육 일정의 차시와 시간을 입력해 주세요.',
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

const fieldError = axiosErr({
  success: false,
  message: '입력값 또는 요청 조건을 확인해 주세요.',
  error: {
    code: 'FORM_ANSWER_REQUIRED',
    message: '필수 입력값을 입력해 주세요.',
    field: 'program-application-trained-teachers-seed-basic-info',
    traceId: 'field-trace',
    details: { reason: 'debug-only' },
  },
})
assert.deepEqual(readApplicationApiErrorEnvelope(fieldError), {
  code: 'FORM_ANSWER_REQUIRED',
  message: '필수 입력값을 입력해 주세요.',
  field: 'program-application-trained-teachers-seed-basic-info',
  traceId: 'field-trace',
  details: { reason: 'debug-only' },
})

assert.equal(
  getApiErrorMessageFromBody({
    error: { code: 'UJAT_ORGANIZATION_ALREADY_APPLIED', message: 'UJAT_ORGANIZATION_ALREADY_APPLIED' },
  }),
  '같은 UJAT 프로그램에 이미 신청한 학교입니다.',
)

console.log('application-api-error.selfcheck: ok')
