/**
 * Run: node --experimental-strip-types --experimental-transform-types src/features/auth/sign-up/ui/school-search-modal/map-selected-school.selfcheck.ts
 */
import assert from 'node:assert/strict'
import type { CareerNetUniversityItem } from '@jakorea/location/career-net'
import type { NeisSchoolItem } from '@jakorea/location/neis'
import { mapSearchResultToSelectedSchool } from './map-selected-school.ts'

function careerNetUniversity(overrides: Partial<CareerNetUniversityItem> = {}): CareerNetUniversityItem {
  return {
    seq: '2055987',
    schoolName: '한국대학교',
    schoolGubun: '대학(4년제)',
    schoolType: '일반대학',
    estType: '사립',
    region: '서울',
    address: '서울특별시 종로구',
    campusName: '',
    link: '',
    collegeInfoUrl: '',
    ...overrides,
  }
}

function neisSchool(overrides: Partial<NeisSchoolItem> = {}): NeisSchoolItem {
  return {
    sdSchulCode: '7581089',
    atptOfcdcScCode: 'B10',
    schulNm: '심원초등학교',
    schulKndScNm: '초등학교',
    atptOfcdcScNm: '경기도교육청',
    lctnScNm: '경기도',
    orgRdnma: '경기도 부천시 옥산로 66',
    orgRdnzc: '',
    orgTelno: '',
    hmpgAdres: '',
    foasMemrd: '',
    ...overrides,
  }
}

const careerNetSelected = mapSearchResultToSelectedSchool({
  source: 'careerNet',
  item: careerNetUniversity({ seq: '991122', schoolName: '서울과학기술대학교' }),
})
assert.equal(careerNetSelected?.source, 'careerNet')
assert.equal(careerNetSelected?.neisCode, '991122')
assert.equal(careerNetSelected?.name, '서울과학기술대학교')

assert.equal(
  mapSearchResultToSelectedSchool({
    source: 'careerNet',
    item: careerNetUniversity({ seq: '   ' }),
  }),
  null,
)

const neisSelected = mapSearchResultToSelectedSchool({
  source: 'neis',
  item: neisSchool(),
})
assert.equal(neisSelected?.source, 'neis')
assert.equal(neisSelected?.neisCode, '7581089')
assert.equal(neisSelected?.educationOfficeCode, 'B10')

assert.equal(
  mapSearchResultToSelectedSchool({
    source: 'neis',
    item: neisSchool({ sdSchulCode: '' }),
  }),
  null,
)

console.log('map-selected-school.selfcheck: ok')
