import { describe, expect, it } from 'vitest'
import { toInstructorApplicationFeePolicy } from '@/features/program/general/lib/applicant-instructor-lecture-fee-basis'

describe('toInstructorApplicationFeePolicy', () => {
  it('프로그램 기준은 measure를 해당 없음으로 보낸다', () => {
    expect(
      toInstructorApplicationFeePolicy({
        basisType: 'program',
        measure: null,
        amount: null,
        instructorFeeGrade: '1급 강사비',
      })
    ).toEqual({
      basisType: 'program',
      measure: '해당 없음',
      amount: 0,
      instructorFeeGrade: '1급 강사비',
    })
  })

  it('특강·기타는 출강 1회당 / 1시간 당만 보낸다', () => {
    expect(
      toInstructorApplicationFeePolicy({
        basisType: 'special_lecture',
        measure: '1시간 당',
        amount: '120,000',
        instructorFeeGrade: '2급 강사비',
      })
    ).toMatchObject({ measure: '1시간 당', amount: 120000 })

    expect(
      toInstructorApplicationFeePolicy({
        basisType: 'other_labor',
        measure: 'SESSION',
        amount: '0',
        instructorFeeGrade: '2급 강사비',
      }).measure
    ).toBe('출강 1회당')
  })
})
