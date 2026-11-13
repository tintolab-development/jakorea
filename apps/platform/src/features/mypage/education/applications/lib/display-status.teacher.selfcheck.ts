import assert from 'node:assert/strict'
import {
  getEducationDisplayStatusLabel,
  getEducationDisplayStatusTone,
  TEACHER_EDUCATION_DISPLAY_STATUS_LABEL,
} from './display-status.ts'

assert.equal(getEducationDisplayStatusLabel('waiting_result', { audience: 'teacher' }), '결과 대기')
assert.equal(getEducationDisplayStatusLabel('document_passed', { audience: 'teacher' }), '서류 합격')
assert.equal(getEducationDisplayStatusLabel('in_progress', { audience: 'teacher' }), '진행중')
assert.equal(getEducationDisplayStatusLabel('waiting_result'), '결과 대기')

assert.equal(getEducationDisplayStatusTone('waiting_result'), 'pending')
assert.equal(getEducationDisplayStatusTone('in_progress'), 'progress')
assert.equal(getEducationDisplayStatusTone('completed'), 'completed')
assert.equal(getEducationDisplayStatusTone('rejected'), 'rejected')

assert.equal(getEducationDisplayStatusLabel('approval_cancelled'), '신청 반려')
assert.equal(getEducationDisplayStatusTone('approval_cancelled'), 'rejected')
assert.equal(getEducationDisplayStatusLabel('cancelled'), '신청 취소')
assert.equal(getEducationDisplayStatusTone('cancelled'), 'cancelled')
assert.equal(Object.keys(TEACHER_EDUCATION_DISPLAY_STATUS_LABEL).length, 8)

console.log('display-status.teacher.selfcheck: ok')
