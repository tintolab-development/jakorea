import assert from 'node:assert/strict'
import {
  mapInstructorFeeGradeLabel,
  mapInstructorJaGradeLabel,
} from './response-codes.ts'

assert.equal(mapInstructorFeeGradeLabel('GRADE_1'), '1급 강사비')
assert.equal(mapInstructorFeeGradeLabel('GRADE_2'), '2급 강사비')
assert.equal(mapInstructorFeeGradeLabel(' GRADE_3 '), '3급 강사비')
assert.equal(mapInstructorFeeGradeLabel('3급 강사비'), '3급 강사비')
assert.equal(mapInstructorFeeGradeLabel('GRADE_4'), 'GRADE_4')
assert.equal(mapInstructorJaGradeLabel('A'), 'A등급')
assert.equal(mapInstructorJaGradeLabel(' d '), 'D등급')
assert.equal(mapInstructorJaGradeLabel('D등급'), 'D등급')
assert.equal(mapInstructorJaGradeLabel('E'), 'E')

console.log('instructor response codes selfcheck: ok')
