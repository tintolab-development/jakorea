import assert from 'node:assert/strict'
import {
  buildLectureReportSubmitBody,
  getLectureReportApiErrorMessage,
  isValidLectureReportBindingContext,
} from './lecture-report-contract.ts'

assert.deepEqual(
  buildLectureReportSubmitBody({
    templateVersionId: 606,
    formResponseId: null,
    attachmentGroupId: null,
    answers: { 'question-42': '수업 답변' },
    fileObjectIdsByQuestion: {},
  }),
  {
    templateVersionId: 606,
    formResponseId: null,
    attachmentGroupId: null,
    answers: { 'question-42': '수업 답변' },
    fileObjectIdsByQuestion: {},
  },
)

assert.deepEqual(
  buildLectureReportSubmitBody({
    templateVersionId: 606,
    answers: {},
    fileObjectIdsByQuestion: { 'question-file': [1002] },
  }),
  {
    templateVersionId: 606,
    formResponseId: null,
    attachmentGroupId: null,
    answers: {},
    fileObjectIdsByQuestion: { 'question-file': [1002] },
  },
)

const submitBody = buildLectureReportSubmitBody({
  templateVersionId: 606,
  answers: { a: 1 },
  fileObjectIdsByQuestion: {},
})
assert.equal('bindingId' in submitBody, false)
assert.equal('contextType' in submitBody, false)
assert.equal('contextId' in submitBody, false)
assert.equal('programId' in submitBody, false)
assert.equal('programFormBindingId' in submitBody, false)

assert.equal(
  isValidLectureReportBindingContext({
    contextType: 'INSTRUCTOR_ASSIGNMENT',
    contextId: 404,
    assignmentId: 404,
    instructorApplicationId: null,
  }),
  true,
)

assert.equal(
  isValidLectureReportBindingContext({
    contextType: 'INSTRUCTOR_APPLICATION',
    contextId: 303,
    assignmentId: 404,
    instructorApplicationId: 303,
  }),
  true,
)

assert.equal(
  isValidLectureReportBindingContext({
    contextType: undefined,
    contextId: 404,
    assignmentId: 404,
    instructorApplicationId: null,
  }),
  false,
)

assert.equal(
  isValidLectureReportBindingContext({
    contextType: 'INSTRUCTOR_ASSIGNMENT',
    contextId: 405,
    assignmentId: 404,
    instructorApplicationId: null,
  }),
  false,
)

assert.match(getLectureReportApiErrorMessage({ response: { status: 400 } }), /응답과 강사 배정 정보가 일치하지 않아 제출할 수 없습니다/)
assert.match(getLectureReportApiErrorMessage({ response: { status: 403 } }), /접근하거나 제출할 권한이 없습니다/)
assert.match(
  getLectureReportApiErrorMessage({
    response: {
      status: 403,
      data: { success: false, data: null, error: { code: 'PERMISSION_DENIED', message: '권한 없음' } },
    },
  }),
  /권한 없음/,
)
assert.match(
  getLectureReportApiErrorMessage({
    response: {
      status: 404,
      data: { success: false, data: null, error: { code: 'NOT_FOUND', message: '요청한 API를 찾을 수 없습니다.' } },
    },
  }),
  /요청한 API를 찾을 수 없습니다/,
)
assert.match(
  getLectureReportApiErrorMessage({ response: { status: 404, data: { code: 'LECTURE_REPORT_FORM_BINDING_NOT_FOUND' } } }),
  /제출 가능한 강의보고서가 없습니다/,
)
assert.match(
  getLectureReportApiErrorMessage({
    response: {
      status: 404,
      data: {
        success: false,
        data: null,
        error: { code: 'LECTURE_REPORT_CONTENT_NOT_FOUND', message: 'content missing' },
      },
    },
  }),
  /아직 제출된 강의보고서가 없습니다/,
)
assert.match(
  getLectureReportApiErrorMessage({
    response: {
      status: 409,
      data: {
        success: false,
        data: null,
        error: { code: 'LECTURE_REPORT_CANONICAL_TEMPLATE_UNAVAILABLE' },
      },
    },
  }),
  /강의보고서 양식을 준비 중입니다\. 잠시 후 다시 시도해 주세요\./,
)
assert.match(
  getLectureReportApiErrorMessage({
    response: { status: 500, data: { success: false, data: null, error: { message: '서버 오류' } } },
  }),
  /요청 처리에 실패했습니다\. 잠시 후 다시 시도해 주세요\./,
)

console.log('lecture-report-contract.selfcheck: ok')
