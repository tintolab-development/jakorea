import { describe, expect, it } from 'vitest'
import { toInstructorApplicationFeePolicy } from '@/features/program/general/lib/applicant-instructor-lecture-fee-basis'

const PROGRAM_WAGE_ROWS = [
  { grade: '1급 강사비', pricing: '1시간 당 | 기본 : 1원' },
  { grade: '2급 강사비', pricing: '1시간 당 | 기본 : 2원' },
]

describe('toInstructorApplicationFeePolicy', () => {
  it('프로그램 기준은 PROGRAM·PER_HOUR·GRADE_*·숫자 amount를 보낸다', () => {
    expect(
      toInstructorApplicationFeePolicy(
        {
          basisType: 'program',
          measure: null,
          amount: null,
          instructorFeeGrade: '1급 강사비',
        },
        { programWageGradeRows: PROGRAM_WAGE_ROWS }
      )
    ).toEqual({
      basisType: 'PROGRAM',
      measure: 'PER_HOUR',
      amount: 1,
      instructorFeeGrade: 'GRADE_1',
    })
  })

  it('특강·기타는 RECRUITMENT와 PER_SESSION/PER_HOUR 코드를 보낸다', () => {
    expect(
      toInstructorApplicationFeePolicy({
        basisType: 'special_lecture',
        measure: '1시간 당',
        amount: '120,000',
        instructorFeeGrade: '2급 강사비',
      })
    ).toMatchObject({
      basisType: 'RECRUITMENT',
      measure: 'PER_HOUR',
      amount: 120000,
      instructorFeeGrade: 'GRADE_2',
    })

    expect(
      toInstructorApplicationFeePolicy({
        basisType: 'other_labor',
        measure: '출강 1회당',
        amount: '0',
        instructorFeeGrade: 'GRADE_2',
      })
    ).toMatchObject({
      basisType: 'RECRUITMENT',
      measure: 'PER_SESSION',
      amount: 0,
      instructorFeeGrade: 'GRADE_2',
    })
  })

  it('등급·프로그램 임금을 해석할 수 없으면 null', () => {
    expect(
      toInstructorApplicationFeePolicy({
        basisType: 'program',
        measure: null,
        amount: null,
        instructorFeeGrade: '미지정',
      })
    ).toBeNull()
  })
})
