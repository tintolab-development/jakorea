import assert from 'node:assert/strict'
import {
  getEducationDisplayStatusLabel,
  getEducationDisplayStatusTone,
  TEACHER_EDUCATION_DISPLAY_STATUS_LABEL,
} from './display-status.ts'

assert.equal(getEducationDisplayStatusLabel('waiting_result', { audience: 'teacher' }), '승인 대기')
assert.equal(getEducationDisplayStatusLabel('document_passed', { audience: 'teacher' }), '승인 대기')
assert.equal(getEducationDisplayStatusLabel('in_progress', { audience: 'teacher' }), '진행중')
assert.equal(getEducationDisplayStatusLabel('waiting_result'), '결과 대기')

assert.equal(getEducationDisplayStatusTone('waiting_result'), 'pending')
assert.equal(getEducationDisplayStatusTone('in_progress'), 'progress')
assert.equal(getEducationDisplayStatusTone('completed'), 'completed')
assert.equal(getEducationDisplayStatusTone('rejected'), 'rejected')

assert.equal(Object.keys(TEACHER_EDUCATION_DISPLAY_STATUS_LABEL).length, 6)

console.log('display-status.teacher.selfcheck: ok')
