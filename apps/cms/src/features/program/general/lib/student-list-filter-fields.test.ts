import { describe, expect, it } from 'vitest'
import {
  STUDENT_LIST_GENDER_FILTER_UNSPECIFIED,
  buildStudentClassFilterOptionsFromRows,
  buildStudentGradeClassOptions,
  buildStudentListFilterFields,
  matchesStudentListFilters,
  mergeStudentClassSelectOptions,
  normalizeStudentGradeLabelForClassOption,
} from './student-list-filter-fields'

describe('normalizeStudentGradeLabelForClassOption', () => {
  it('교육 학년 표기를 N학년으로 정규화한다', () => {
    expect(normalizeStudentGradeLabelForClassOption('4학년')).toBe('4학년')
    expect(normalizeStudentGradeLabelForClassOption('4')).toBe('4학년')
    expect(normalizeStudentGradeLabelForClassOption('초등학교 4학년')).toBe('4학년')
    expect(normalizeStudentGradeLabelForClassOption('')).toBe('')
  })
})

describe('buildStudentGradeClassOptions', () => {
  it('신청 학급 수와 교육 학년으로 학급 옵션을 만든다', () => {
    expect(buildStudentGradeClassOptions(3, '4학년')).toEqual([
      { label: '4학년 1반', value: '4학년 1반' },
      { label: '4학년 2반', value: '4학년 2반' },
      { label: '4학년 3반', value: '4학년 3반' },
    ])
    expect(buildStudentGradeClassOptions(2)).toEqual([
      { label: '1반', value: '1반' },
      { label: '2반', value: '2반' },
    ])
    expect(buildStudentGradeClassOptions(0)).toEqual([])
  })
})

describe('buildStudentClassFilterOptionsFromRows', () => {
  it('명단에 입력된 학급만 중복 없이 정렬해 옵션으로 만든다', () => {
    expect(
      buildStudentClassFilterOptionsFromRows([
        { gradeClass: '2반' },
        { gradeClass: '1반' },
        { gradeClass: '2반' },
        { gradeClass: '  ' },
        { gradeClass: null },
        { gradeClass: '3반' },
      ])
    ).toEqual([
      { label: '1반', value: '1반' },
      { label: '2반', value: '2반' },
      { label: '3반', value: '3반' },
    ])
  })
})

describe('mergeStudentClassSelectOptions', () => {
  it('신청 학급 옵션과 명단 학급을 합친다', () => {
    expect(
      mergeStudentClassSelectOptions(
        buildStudentGradeClassOptions(2, '4학년'),
        buildStudentClassFilterOptionsFromRows([{ gradeClass: '5학년 1반' }])
      )
    ).toEqual([
      { label: '4학년 1반', value: '4학년 1반' },
      { label: '4학년 2반', value: '4학년 2반' },
      { label: '5학년 1반', value: '5학년 1반' },
    ])
  })
})

describe('matchesStudentListFilters', () => {
  const row = { name: '김학생', gender: 'male' as const, gradeClass: '1반' }

  it('조회 적용 필터 — 학생명 부분 일치', () => {
    expect(
      matchesStudentListFilters(row, {
        studentName: '김',
        studentGender: 'all',
        studentClass: 'all',
      })
    ).toBe(true)
    expect(
      matchesStudentListFilters(row, {
        studentName: '이',
        studentGender: 'all',
        studentClass: 'all',
      })
    ).toBe(false)
  })

  it('성별 남/여 및 해당 없음(미기재)를 구분한다', () => {
    expect(
      matchesStudentListFilters(row, {
        studentName: '',
        studentGender: 'male',
        studentClass: 'all',
      })
    ).toBe(true)
    expect(
      matchesStudentListFilters(row, {
        studentName: '',
        studentGender: 'female',
        studentClass: 'all',
      })
    ).toBe(false)
    expect(
      matchesStudentListFilters(
        { name: '미기재', gender: undefined, gradeClass: '1반' },
        {
          studentName: '',
          studentGender: STUDENT_LIST_GENDER_FILTER_UNSPECIFIED,
          studentClass: 'all',
        }
      )
    ).toBe(true)
    expect(
      matchesStudentListFilters(row, {
        studentName: '',
        studentGender: STUDENT_LIST_GENDER_FILTER_UNSPECIFIED,
        studentClass: 'all',
      })
    ).toBe(false)
  })

  it('학급 일치만 통과한다', () => {
    expect(
      matchesStudentListFilters(row, {
        studentName: '',
        studentGender: 'all',
        studentClass: '1반',
      })
    ).toBe(true)
    expect(
      matchesStudentListFilters(row, {
        studentName: '',
        studentGender: 'all',
        studentClass: '2반',
      })
    ).toBe(false)
  })
})

describe('buildStudentListFilterFields', () => {
  it('성별 옵션에 해당 없음(미기재)를 포함하고 학급 옵션을 인자로 받는다', () => {
    const fields = buildStudentListFilterFields([{ label: '1반', value: '1반' }])
    const gender = fields.find(field => field.key === 'studentGender')
    const klass = fields.find(field => field.key === 'studentClass')
    expect(gender?.type).toBe('select')
    if (gender?.type === 'select') {
      expect(gender.options).toEqual(
        expect.arrayContaining([
          { label: '남', value: 'male' },
          { label: '여', value: 'female' },
          { label: '해당 없음(미기재)', value: STUDENT_LIST_GENDER_FILTER_UNSPECIFIED },
        ])
      )
    }
    expect(klass?.type).toBe('select')
    if (klass?.type === 'select') {
      expect(klass.options).toEqual([{ label: '1반', value: '1반' }])
    }
  })
})
