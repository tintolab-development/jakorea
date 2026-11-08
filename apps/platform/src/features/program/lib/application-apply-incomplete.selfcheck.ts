import assert from 'node:assert/strict'
import { emptyInstitutionBasicInfo } from '../ui/apply-institution-basic-info/apply-institution-basic-info-answers.ts'
import { resolveGeneralBasicInfoApplyIncomplete } from './application-apply-incomplete.ts'

const paragraphId = 'program-application-form-institution-basic-info'

const classCountMissing = resolveGeneralBasicInfoApplyIncomplete(
  {
    ...emptyInstitutionBasicInfo(),
    schoolName: '테스트학교',
    regionLabel: '서울',
    applicationGrade: '3',
    addressDetail: '주소',
    applicationReason: '사유',
    studentCount: '30',
    classCount: '',
  },
  paragraphId,
)
assert.ok(classCountMissing)
assert.equal(classCountMissing.field, 'classCount')
assert.equal(classCountMissing.message, '신청 학급 수를 선택해 주세요.')

console.log('application-apply-incomplete.selfcheck: ok')
