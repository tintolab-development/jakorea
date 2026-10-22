import assert from 'node:assert/strict'
import { resolveSignupSchoolAttachment } from './signup-school-attachment.ts'

const selection = resolveSignupSchoolAttachment({
  schoolName: '심원초등학교',
  schoolNeisCode: '7581089',
  schoolEducationOfficeCode: 'B10',
  schoolAddress: '경기도 부천시 옥산로 66',
  source: 'neis',
})

assert.equal(selection.schoolSelection?.provider, 'NEIS')
assert.equal(selection.schoolSelection?.externalSchoolCode, '7581089')
assert.equal(selection.schoolSelection?.educationOfficeCode, 'B10')

const careerNet = resolveSignupSchoolAttachment({
  schoolName: '서울과학기술대학교',
  schoolNeisCode: '991122',
  source: 'careerNet',
})
assert.equal(careerNet.schoolSelection?.provider, 'CAREER_NET')
assert.equal(careerNet.schoolSelection?.externalSchoolCode, '991122')

assert.equal(
  resolveSignupSchoolAttachment({
    schoolName: '코드없는대학',
    source: 'careerNet',
  }).schoolSelection,
  undefined,
)

console.log('build-school-selection.selfcheck: ok')
