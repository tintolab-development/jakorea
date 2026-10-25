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
  answers: { 'question-42': '수업 답변' },
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

console.log('lecture-report-contract.selfcheck: ok')
