/**
 * Run: node --experimental-strip-types --experimental-transform-types src/features/mypage/education/applications/lib/student-roster-upload-policy.selfcheck.ts
 */
import {
  STUDENT_ROSTER_UPLOAD_MAX_BYTES,
  validateStudentRosterUploadFile,
} from './student-roster-upload-policy.ts'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

assert(
  validateStudentRosterUploadFile(new File(['a'], '명단.xlsx')) === null,
  'xlsx allowed'
)
assert(validateStudentRosterUploadFile(new File(['a'], '명단.csv')) === null, 'csv allowed')
assert(
  validateStudentRosterUploadFile(new File(['a'], '명단.xls'))?.includes('.xls'),
  'xls rejected'
)
assert(
  validateStudentRosterUploadFile(
    new File([new Uint8Array(STUDENT_ROSTER_UPLOAD_MAX_BYTES + 1)], 'big.xlsx')
  )?.includes('20MB'),
  'oversize rejected'
)

console.log('student-roster-upload-policy.selfcheck: ok')
