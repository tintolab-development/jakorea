import assert from 'node:assert/strict'
import {
  buildLectureReportFormResponseBody,
  getLectureReportApiErrorMessage,
  isValidLectureReportBindingContext,
} from './lecture-report-contract.ts'

const common = {
  templateVersionId: 606,
  programId: 101,
  programFormBindingId: 505,
  programScheduleId: 707,
  answers: { 'question-42': '수업 답변' },
  fileObjectIdsByQuestion: {},
}

assert.deepEqual(
  buildLectureReportFormResponseBody({
    ...common,
    contextType: 'INSTRUCTOR_APPLICATION',
    contextId: 303,
  }),
  {
    ...common,
    contextType: 'INSTRUCTOR_APPLICATION',
    contextId: 303,
  },
)

assert.deepEqual(
  buildLectureReportFormResponseBody({
    ...common,
    contextType: 'INSTRUCTOR_ASSIGNMENT',
    contextId: 404,
    fileObjectIdsByQuestion: { 'question-file': [1002] },
  }),
  {
    ...common,
    contextType: 'INSTRUCTOR_ASSIGNMENT',
    contextId: 404,
    fileObjectIdsByQuestion: { 'question-file': [1002] },
  },
)

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
  getLectureReportApiErrorMessage({ response: { status: 404, data: { code: 'LECTURE_REPORT_FORM_BINDING_NOT_FOUND' } } }),
  /현재 활성화된 강의보고서 양식을 사용할 수 없습니다/,
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
