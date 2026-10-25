import { describe, expect, it } from 'vitest'

import { sortNeisSchools } from '@jakorea/location/neis'
import type { NeisSchoolItem } from '@jakorea/location/neis'

function school(
  id: string,
  schulNm: string,
  region: string,
  schulKndScNm: string,
  atptOfcdcScCode = id,
): NeisSchoolItem {
  return {
    sdSchulCode: id,
    atptOfcdcScCode,
    schulNm,
    schulKndScNm,
    atptOfcdcScNm: region,
    lctnScNm: '',
    orgRdnma: '',
    orgRdnzc: '',
    orgTelno: '',
    hmpgAdres: '',
    foasMemrd: '',
  }
}

describe('sortNeisSchools', () => {
  it('sorts the complete result set by school name, region, level, and stable codes', () => {
    const schools = [
      school('B-2', '가나다학교', '서울', '초등학교', 'B10'),
      school('A-1', '나래학교', '부산', '중학교', 'C10'),
      school('A-2', '가나다학교', '서울', '고등학교', 'A10'),
      school('A-3', '가나다학교', '부산', '중학교', 'C10'),
      school('A-4', '가나다학교', '서울', '초등학교', 'A10'),
    ]

    const sorted = sortNeisSchools(schools)

    expect(sorted.map(item => item.sdSchulCode)).toEqual(['A-3', 'A-2', 'A-4', 'B-2', 'A-1'])
    expect(schools.map(item => item.sdSchulCode)).toEqual(['B-2', 'A-1', 'A-2', 'A-3', 'A-4'])
  })
})
