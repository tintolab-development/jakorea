import { describe, expect, it } from 'vitest'
import {
  buildLectureFeeBasisViewSegments,
  parseLectureFeeBasisTypeFromApi,
  toInstructorApplicationFeePolicy,
} from '@/features/program/general/lib/applicant-instructor-lecture-fee-basis'
import type { ApplicantInstructorRow } from '@/features/program/shared/model/applicant-instructor'

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

describe('buildLectureFeeBasisViewSegments', () => {
  it('값이 없으면 빈 배열이다', () => {
    expect(buildLectureFeeBasisViewSegments({} as ApplicantInstructorRow)).toEqual([])
  })

  it('특강은 유형·지급 기준·금액을 모두 보여 준다', () => {
    expect(
      buildLectureFeeBasisViewSegments({
        lectureFeeBasisType: 'special_lecture',
        lectureFeeMeasure: '출강 1회당',
        lectureFeeAmount: '915000',
      } as ApplicantInstructorRow)
    ).toEqual(['특강 강사비', '출강 1회당', '915,000원'])
  })

  it('프로그램 기준도 API 지급 단위가 있으면 보여 준다', () => {
    expect(
      buildLectureFeeBasisViewSegments({
        lectureFeeBasisType: 'program',
        lectureFeeMeasure: '1시간 당',
        lectureFeeAmount: '120000',
      } as ApplicantInstructorRow)
    ).toEqual(['프로그램 기준', '1시간 당', '120,000원'])
  })

  it('유형이 없어도 금액만 있으면 프로그램 기준으로 본다', () => {
    expect(
      buildLectureFeeBasisViewSegments({
        lectureFeeAmount: '120000',
      } as ApplicantInstructorRow)
    ).toEqual(['프로그램 기준', '120,000원'])
  })
})

describe('parseLectureFeeBasisTypeFromApi', () => {
  it('PROGRAM과 program은 프로그램 기준이다', () => {
    expect(parseLectureFeeBasisTypeFromApi('PROGRAM')).toBe('program')
    expect(parseLectureFeeBasisTypeFromApi('program')).toBe('program')
  })

  it('RECRUITMENT만 특강으로 본다', () => {
    expect(parseLectureFeeBasisTypeFromApi('RECRUITMENT')).toBe('special_lecture')
    expect(parseLectureFeeBasisTypeFromApi('special_lecture')).toBe('special_lecture')
  })
})
