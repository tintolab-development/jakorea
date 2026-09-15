import assert from 'node:assert/strict'
import { buildSchoolSelection } from './build-school-selection.ts'
import { resolveNeisEducationOfficeCode } from './resolve-neis-education-office-code.ts'

assert.equal(
  resolveNeisEducationOfficeCode({
    educationOfficeCode: 'B10',
    externalSchoolCode: '7581089',
  }),
  'B10',
)

const selection = buildSchoolSelection({
  schoolName: '심원초등학교',
  schoolNeisCode: '7581089',
  schoolEducationOfficeCode: 'B10',
  schoolAddress: '경기도 부천시 옥산로 66',
  source: 'neis',
})

assert.equal(selection?.provider, 'NEIS')
assert.equal(selection?.externalSchoolCode, '7581089')
assert.equal(selection?.educationOfficeCode, 'B10')

console.log('build-school-selection.selfcheck: ok')
