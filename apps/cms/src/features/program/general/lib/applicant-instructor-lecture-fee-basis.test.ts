import { describe, expect, it } from 'vitest'
import {
  buildGeneralOrganizationLectureFeeBasisViewSegments,
  buildLectureFeeBasisViewSegments,
  parseLectureFeeBasisTypeFromApi,
  toApiInstructorFeePolicyMeasure,
  toInstructorApplicationFeePolicy,
  buildLectureFeeBasisDisplay,
  lectureFeeMeasureLabel,
  normalizeLectureFeeMeasure,
  resolveLectureFeeBasisFromRow,
  LECTURE_FEE_MEASURE_OPTIONS,
} from '@/features/program/general/lib/applicant-instructor-lecture-fee-basis'
import type { ApplicantInstructorRow } from '@/features/program/shared/model/applicant-instructor'

const PROGRAM_WAGE_ROWS = [
  { grade: '1급 강사비', pricing: '1시간 당 | 기본 : 1원' },
  { grade: '2급 강사비', pricing: '1시간 당 | 기본 : 2원' },
]

describe('toInstructorApplicationFeePolicy', () => {
  it('프로그램 기준은 PROGRAM·PER_CLASS(차시당)·GRADE_*·숫자 amount를 보낸다', () => {
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
      measure: 'PER_CLASS',
      amount: 1,
      instructorFeeGrade: 'GRADE_1',
    })
  })

  it('특강·기타는 SPECIAL_LECTURE/OTHER_LABOR와 PER_LECTURE/PER_CLASS 코드를 보낸다', () => {
    expect(
      toInstructorApplicationFeePolicy({
        basisType: 'special_lecture',
        measure: '차시당',
        amount: '120,000',
        instructorFeeGrade: '2급 강사비',
      })
    ).toMatchObject({
      basisType: 'SPECIAL_LECTURE',
      measure: 'PER_CLASS',
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
      basisType: 'OTHER_LABOR',
      measure: 'PER_LECTURE',
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
    ).toEqual(['프로그램 기준', '차시당', '120,000원'])
  })

  it('유형이 없어도 금액만 있으면 프로그램 기준으로 본다', () => {
    expect(
      buildLectureFeeBasisViewSegments({
        lectureFeeAmount: '120000',
      } as ApplicantInstructorRow)
    ).toEqual(['프로그램 기준', '120,000원'])
  })

  it('강사비 등급만 있고 feePolicy가 없으면 책정 기준을 만들지 않는다', () => {
    expect(
      buildLectureFeeBasisViewSegments({
        instructorFeeGradeLabel: '1급 강사비',
      } as ApplicantInstructorRow)
    ).toEqual([])
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

describe('businessIncomeEarnerStatusPatchField', () => {
  it('표시값과 같으면 필드를 생략해 기존 신청값(또는 프로필 fallback)을 유지한다', async () => {
    const { businessIncomeEarnerStatusPatchField } =
      await import('./applicant-instructor-lecture-fee-basis')
    expect(businessIncomeEarnerStatusPatchField('해당', '해당')).toEqual({})
    expect(businessIncomeEarnerStatusPatchField('해당', undefined)).toEqual({})
  })

  it('바뀌면 신청 override로 보낸다', async () => {
    const { businessIncomeEarnerStatusPatchField } =
      await import('./applicant-instructor-lecture-fee-basis')
    expect(businessIncomeEarnerStatusPatchField('해당', '해당 없음')).toEqual({
      businessIncomeEarnerStatus: '해당 없음',
    })
    expect(businessIncomeEarnerStatusPatchField(null, '해당')).toEqual({
      businessIncomeEarnerStatus: '해당',
    })
  })
})

describe('강사비 지급 기준 공통 라벨 (기획 11/10 「차시당 / 출강 1회당」)', () => {
  it('모든 유형 공통 옵션 — 값은 그대로(1시간 당=PER_CLASS, 출강 1회당=PER_LECTURE)', () => {
    expect(LECTURE_FEE_MEASURE_OPTIONS).toEqual([
      { value: '1시간 당', label: '차시당' },
      { value: '출강 1회당', label: '출강 1회당' },
    ])
  })

  it('예전 라벨·값 표기도 값·새 라벨로 읽힌다', () => {
    for (const legacy of ['1시간 당', '1시간당', '1시간 기준', '차시당']) {
      expect(normalizeLectureFeeMeasure(legacy)).toBe('1시간 당')
      expect(lectureFeeMeasureLabel(legacy)).toBe('차시당')
      expect(toApiInstructorFeePolicyMeasure(legacy, 'special_lecture')).toBe('PER_CLASS')
    }
    for (const legacy of ['출강 1회당', '1회당', '1회 기준']) {
      expect(normalizeLectureFeeMeasure(legacy)).toBe('출강 1회당')
      expect(lectureFeeMeasureLabel(legacy)).toBe('출강 1회당')
      expect(toApiInstructorFeePolicyMeasure(legacy, 'special_lecture')).toBe('PER_LECTURE')
    }
  })

  it('표시 문자열 왕복 — 저장은 새 라벨, 다시 읽으면 같은 값', () => {
    for (const value of ['1시간 당', '출강 1회당']) {
      const display = buildLectureFeeBasisDisplay('special_lecture', value, '50000')
      expect(display).toBe(`특강 강사비 | ${lectureFeeMeasureLabel(value)} | 50,000원`)
      expect(
        resolveLectureFeeBasisFromRow({ lectureFeeBasisDisplay: display } as ApplicantInstructorRow)
      ).toEqual({ type: 'special_lecture', measure: value, amount: '50000' })
    }
    // 예전 라벨로 저장된 표시 문자열
    expect(
      resolveLectureFeeBasisFromRow({
        lectureFeeBasisDisplay: '기타 인건비 | 1시간 기준 | 30,000원',
      } as ApplicantInstructorRow).measure
    ).toBe('1시간 당')
  })
})

describe('buildGeneralOrganizationLectureFeeBasisViewSegments — 일반(기관형) 시안 06-1·06-2', () => {
  it('값이 없으면 빈 배열이다', () => {
    expect(
      buildGeneralOrganizationLectureFeeBasisViewSegments({} as ApplicantInstructorRow)
    ).toEqual([])
  })

  it('프로그램 기준: 「프로그램 기준 | 3급 강사비 : 차시당 240,000원」', () => {
    expect(
      buildGeneralOrganizationLectureFeeBasisViewSegments({
        lectureFeeBasisType: 'program',
        lectureFeeMeasure: '1시간 당',
        lectureFeeAmount: '240000',
        instructorFeeGradeLabel: '3급 강사비',
      } as ApplicantInstructorRow)
    ).toEqual(['프로그램 기준', '3급 강사비 : 차시당 240,000원'])
  })

  it('특강 강사비: 「특강 강사비 | 출강 1회당 150,000원」', () => {
    expect(
      buildGeneralOrganizationLectureFeeBasisViewSegments({
        lectureFeeBasisType: 'special_lecture',
        lectureFeeMeasure: '출강 1회당',
        lectureFeeAmount: '150000',
      } as ApplicantInstructorRow)
    ).toEqual(['특강 강사비', '출강 1회당 150,000원'])
  })

  it('기타 인건비는 특강과 같은 규칙이다', () => {
    expect(
      buildGeneralOrganizationLectureFeeBasisViewSegments({
        lectureFeeBasisType: 'other_labor',
        lectureFeeMeasure: '1시간 당',
        lectureFeeAmount: '50000',
      } as ApplicantInstructorRow)
    ).toEqual(['기타 인건비', '차시당 50,000원'])
  })
})

describe('출강 1회당 코드(K13, 2026-11-12)', () => {
  it('출강 1회당·기존 PER_SESSION·SESSION은 모두 PER_LECTURE로 보낸다', () => {
    expect(toApiInstructorFeePolicyMeasure('출강 1회당', 'special_lecture')).toBe('PER_LECTURE')
    expect(toApiInstructorFeePolicyMeasure('PER_SESSION', 'other_labor')).toBe('PER_LECTURE')
    expect(toApiInstructorFeePolicyMeasure(undefined, 'special_lecture')).toBe('PER_LECTURE')
    expect(toApiInstructorFeePolicyMeasure(null, 'program', 'SESSION')).toBe('PER_LECTURE')
    expect(toApiInstructorFeePolicyMeasure(null, 'program', 'PER_HOUR')).toBe('PER_CLASS')
  })

  it('차시당(기존 저장값 1시간 당 포함)은 PER_CLASS로 보낸다 (Q2)', () => {
    expect(toApiInstructorFeePolicyMeasure('차시당', 'special_lecture')).toBe('PER_CLASS')
    expect(toApiInstructorFeePolicyMeasure('1시간 당', 'other_labor')).toBe('PER_CLASS')
  })
})
