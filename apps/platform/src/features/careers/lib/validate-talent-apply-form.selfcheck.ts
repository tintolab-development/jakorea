/**
 * 인재채용 지원 폼 zod schema 안정성 selfcheck.
 * Run: node --experimental-strip-types --experimental-transform-types src/features/careers/lib/validate-talent-apply-form.selfcheck.ts
 */
import { EMPTY_CAREERS_TALENT_APPLY_FORM_VALUES } from './talent-apply-form.ts'
import {
  careersTalentApplyFormSchema,
  collectCareersTalentApplyFieldErrors,
  hasCareersTalentApplyFieldErrors,
} from './validate-talent-apply-form.ts'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

const emptyErrors = collectCareersTalentApplyFieldErrors(EMPTY_CAREERS_TALENT_APPLY_FORM_VALUES)
assert(hasCareersTalentApplyFieldErrors(emptyErrors), 'empty form must be invalid')
assert(emptyErrors.jobInterest, 'jobInterest required')
assert(emptyErrors.name, 'name required')
assert(emptyErrors.phone, 'phone required')
assert(emptyErrors.email, 'email required')
assert(emptyErrors.addressRoad, 'addressRoad required')
assert(emptyErrors.addressDetail, 'addressDetail required')
assert(emptyErrors.educationLevel, 'educationLevel required')
assert(emptyErrors.educationInfo, 'educationInfo required')
assert(emptyErrors.careerType, 'careerType required')
assert(emptyErrors.careerInfo, 'careerInfo required')
assert(emptyErrors.privacy, 'privacy required')
assert(!emptyErrors.schoolName, 'schoolName is optional')
assert(!emptyErrors.major, 'major is optional')

const invalidEmail = collectCareersTalentApplyFieldErrors({
  ...EMPTY_CAREERS_TALENT_APPLY_FORM_VALUES,
  jobInterest: 'accounting',
  name: '홍길동',
  phone: '010-1234-5678',
  email: 'not-an-email',
  addressRoad: '서울시',
  addressDetail: '101호',
  educationLevel: 'university',
  educationInfo: '학력',
  careerType: 'newbie',
  careerInfo: '경력',
  privacyAgreed: true,
})
assert(invalidEmail.email, 'invalid email must fail')
assert(!invalidEmail.name, 'name should pass when filled')

const valid = {
  jobInterest: 'managementPlanning' as const,
  name: '홍길동',
  phone: '010-1234-5678',
  email: 'test@jakorea.org',
  addressRoad: '서울특별시 중구',
  addressDetail: '상세 101',
  educationLevel: 'university' as const,
  schoolName: 'JA대',
  major: '경영',
  educationInfo: '학력 상세',
  careerType: 'experienced' as const,
  careerInfo: '경력 상세',
  privacyAgreed: true as const,
}

const validParsed = careersTalentApplyFormSchema.safeParse(valid)
assert(validParsed.success, 'valid payload must pass schema')

const validErrors = collectCareersTalentApplyFieldErrors(valid)
assert(!hasCareersTalentApplyFieldErrors(validErrors), 'valid payload must have no field errors')

const privacyOnly = collectCareersTalentApplyFieldErrors({
  ...valid,
  privacyAgreed: false,
})
assert(privacyOnly.privacy, 'privacyAgreed false must map to privacy')
assert(Object.keys(privacyOnly).length === 1, 'privacy-only failure should be single key')

console.log('validate-talent-apply-form.selfcheck: ok')
