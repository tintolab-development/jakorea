/**
 * Run: node --experimental-strip-types --experimental-transform-types src/features/auth/sign-up/ui/school-search-modal/map-selected-school.selfcheck.ts
 */
import assert from 'node:assert/strict'
import type { CareerNetUniversityItem } from '@jakorea/location/career-net'
import type { NeisSchoolItem } from '@jakorea/location/neis'
import { mapSearchResultToSelectedSchool, toCareerNetSchoolLevel } from './map-selected-school.ts'

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
// 학교급 — NEIS는 학교종류명, 알 수 없는 종류(특수학교 등)는 없음
assert.equal(neisSelected?.schoolLevel, '초등학교')
assert.equal(
  mapSearchResultToSelectedSchool({
    source: 'neis',
    item: neisSchool({ schulKndScNm: '특수학교' }),
  })?.schoolLevel,
  undefined,
)
// 커리어넷 — 학교급 '전체'로 고른 경우 결과의 학교 구분값으로 정한다
assert.equal(careerNetSelected?.schoolLevel, '대학교')
assert.equal(
  mapSearchResultToSelectedSchool({
    source: 'careerNet',
    item: careerNetUniversity({ schoolGubun: '전문대학', schoolType: '전문대학' }),
  })?.schoolLevel,
  '전문대학',
)
// 매핑할 수 없는 구분값은 학교급 없음(학년 1~12)
assert.equal(
  mapSearchResultToSelectedSchool({
    source: 'careerNet',
    item: careerNetUniversity({ schoolGubun: '대학원', schoolType: '대학원' }),
  })?.schoolLevel,
  undefined,
)
assert.equal(toCareerNetSchoolLevel({ schoolGubun: '', schoolType: '' }), undefined)
assert.equal(toCareerNetSchoolLevel({ schoolGubun: '', schoolType: '전문대학' }), '전문대학')
// 학교급을 골라 검색했으면 그 값을 쓴다
assert.equal(
  mapSearchResultToSelectedSchool(
    { source: 'careerNet', item: careerNetUniversity() },
    '전문대학',
  )?.schoolLevel,
  '전문대학',
)

assert.equal(
  mapSearchResultToSelectedSchool({
    source: 'neis',
    item: neisSchool({ sdSchulCode: '' }),
  }),
  null,
)

console.log('map-selected-school.selfcheck: ok')
