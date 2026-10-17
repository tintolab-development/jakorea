import { describe, expect, it } from 'vitest'
import {
  buildRegisteredGradeClassSelectOptions,
  buildStudentAddGradeClassOptions,
  buildStudentEditGradeClassOptions,
  parseStudentGradeClassForRosterApi,
  withLegacyStudentGradeClassOption,
} from './student-registered-grade-class-options'

describe('buildRegisteredGradeClassSelectOptions', () => {
  it('등록된 반 번호만 노출하고 빈 classNo는 건너뛴다 (TC-01)', () => {
    const options = buildRegisteredGradeClassSelectOptions(
      [
        {
          gradeLabel: '3학년',
          classCount: 5,
          classes: [{ classNo: '1' }, { classNo: '3' }, { classNo: '5' }],
        },
      ],
      '3학년'
    )
    expect(options.map(option => option.value)).toEqual(['1반', '3반', '5반'])
  })

  it('classNo가 이미 1반 형태이면 그대로 사용한다', () => {
    const options = buildRegisteredGradeClassSelectOptions([
      {
        gradeLabel: '3학년',
        classes: [{ classNo: '1반' }, { classNo: '2반' }],
      },
    ])
    expect(options.map(option => option.value)).toEqual(['1반', '2반'])
  })

  it('classCount만 있고 classes가 비어 있으면 옵션을 만들지 않는다', () => {
    expect(
      buildRegisteredGradeClassSelectOptions([{ gradeLabel: '3학년', classCount: 3, classes: [] }])
    ).toEqual([])
  })

  it('여러 학년이면 학년을 포함해 표시한다 (TC-06)', () => {
    const options = buildRegisteredGradeClassSelectOptions([
      {
        gradeLabel: '3학년',
        classes: [{ classNo: '1' }, { classNo: '2' }],
      },
      {
        gradeLabel: '4학년',
        classes: [{ classNo: '1' }],
      },
    ])
    expect(options.map(option => option.value)).toEqual([
      '3학년 1반',
      '3학년 2반',
      '4학년 1반',
    ])
  })
})

describe('buildStudentEditGradeClassOptions', () => {
  const registered = buildRegisteredGradeClassSelectOptions(
    [
      {
        gradeLabel: '3학년',
        classes: [{ classNo: '1' }, { classNo: '2' }, { classNo: '3' }],
      },
    ],
    '3학년'
  )

  it('학생의 현재 학급을 기본 선택 가능 목록에 유지한다 (TC-03)', () => {
    const options = buildStudentEditGradeClassOptions({
      registeredOptions: registered,
      studentGradeClass: '2반',
      educationGrade: '3학년',
    })
    expect(options.some(option => option.value === '2반')).toBe(true)
  })

  it('유효 목록에 없는 기존 학급은 (기존)으로 표시한다 (TC-07)', () => {
    const options = buildStudentEditGradeClassOptions({
      registeredOptions: registered,
      studentGradeClass: '4반',
      educationGrade: '3학년',
    })
    expect(options[0]).toEqual({ label: '4반 (기존)', value: '4반' })
  })

  it('여러 학년일 때 다른 학년 반은 노출하지 않는다', () => {
    const multi = buildRegisteredGradeClassSelectOptions([
      { gradeLabel: '3학년', classes: [{ classNo: '1' }] },
      { gradeLabel: '4학년', classes: [{ classNo: '1' }] },
    ])
    const options = buildStudentEditGradeClassOptions({
      registeredOptions: multi,
      studentGradeClass: '3학년 1반',
      educationGrade: '3학년',
    })
    expect(options.map(option => option.value)).toEqual(['3학년 1반'])
  })
})

describe('buildStudentAddGradeClassOptions', () => {
  it('등록 학급에 학생 0명인 반도 추가 옵션에 포함한다 (TC-08)', () => {
    const registered = buildRegisteredGradeClassSelectOptions(
      [
        {
          gradeLabel: '3학년',
          classes: [{ classNo: '1' }, { classNo: '2' }, { classNo: '3' }],
        },
      ],
      '3학년'
    )
    const options = buildStudentAddGradeClassOptions({
      registeredOptions: registered,
      rosterFallbackOptions: [{ label: '1반', value: '1반' }],
    })
    expect(options.map(option => option.value)).toEqual(['1반', '2반', '3반'])
  })
})

describe('parseStudentGradeClassForRosterApi', () => {
  it('단일 학년 표시는 institution grade + 반으로 분리한다', () => {
    expect(parseStudentGradeClassForRosterApi('2반', '초5')).toEqual({
      grade: '초5',
      className: '2반',
    })
  })

  it('학년·반 표시는 각각 분리한다', () => {
    expect(parseStudentGradeClassForRosterApi('4학년 1반', '3학년')).toEqual({
      grade: '4학년',
      className: '1반',
    })
  })
})

describe('withLegacyStudentGradeClassOption', () => {
  it('중복 legacy 값은 추가하지 않는다', () => {
    expect(
      withLegacyStudentGradeClassOption([{ label: '1반', value: '1반' }], '1반')
    ).toHaveLength(1)
  })
})
