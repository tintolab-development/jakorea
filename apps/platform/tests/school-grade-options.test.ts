import { describe, expect, it } from 'vitest'

import {
  getSchoolGradeOptions,
  isGradeInSchoolLevel,
  toSchoolLevel,
} from '../src/features/auth/sign-up/lib/school-grade'

const ALL = [
  '1학년',
  '2학년',
  '3학년',
  '4학년',
  '5학년',
  '6학년',
  '7학년',
  '8학년',
  '9학년',
  '10학년',
  '11학년',
  '12학년',
] as const

describe('학교급별 학년 옵션 (기획 2026-11-14)', () => {
  it('초등·대학교·전문대학은 1~6학년, 중·고등학교는 1~3학년', () => {
    expect(getSchoolGradeOptions('초등학교', ALL)).toEqual(ALL.slice(0, 6))
    expect(getSchoolGradeOptions('중학교', ALL)).toEqual(ALL.slice(0, 3))
    expect(getSchoolGradeOptions('고등학교', ALL)).toEqual(ALL.slice(0, 3))
    expect(getSchoolGradeOptions('대학교', ALL)).toEqual(ALL.slice(0, 6))
    expect(getSchoolGradeOptions('전문대학', ALL)).toEqual(ALL.slice(0, 6))
  })

  it('학교급을 모르면(직접 입력·특수학교 등) 기존 옵션을 그대로 쓴다', () => {
    expect(getSchoolGradeOptions(null, ALL)).toBe(ALL)
    expect(getSchoolGradeOptions('특수학교', ALL)).toBe(ALL)
    expect(toSchoolLevel('각종학교')).toBeUndefined()
  })

  it('학교를 바꿔 고른 학년이 새 범위 밖이면 범위 밖으로 판정한다', () => {
    expect(isGradeInSchoolLevel('5학년', '고등학교', ALL)).toBe(false)
    expect(isGradeInSchoolLevel('3학년', '고등학교', ALL)).toBe(true)
    expect(isGradeInSchoolLevel('', '중학교', ALL)).toBe(true)
    expect(isGradeInSchoolLevel('12학년', null, ALL)).toBe(true)
  })
})
