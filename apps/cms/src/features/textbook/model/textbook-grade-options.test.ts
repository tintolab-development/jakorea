import { describe, expect, it } from 'vitest'
import {
  decodeTextbookRegisterGradeValue,
  gradesByTargetFromRegisterValues,
  syncTextbookRegisterGradesAfterTargetsChange,
  nextTextbookRegisterGradeValues,
  nextTextbookRegisterGradeValuesForTargets,
  parseTextbookRegisterGradeValues,
  parseTextbookRegisterGradeValuesForTargets,
  serializeTextbookRegisterGrades,
  textbookFilterGradeOptions,
  textbookRegisterGradeOptions,
  textbookRegisterGradeOptionsForTargets,
} from './textbook-grade-options'

describe('textbook-grade-options', () => {
  it('교육 대상별 필터 옵션', () => {
    expect(textbookFilterGradeOptions('유아').map(o => o.label)).toEqual([
      '전체',
      '유아',
      '유치원생',
    ])
    expect(textbookFilterGradeOptions('유아').map(o => o.value)).toEqual([
      '전체',
      '유아',
      '유치원생',
    ])

    expect(textbookFilterGradeOptions('초등학교').map(o => o.label)).toEqual([
      '전학년',
      '1학년',
      '2학년',
      '3학년',
      '4학년',
      '5학년',
      '6학년',
    ])

    expect(textbookFilterGradeOptions('중학교').map(o => o.label)).toEqual([
      '전학년',
      '1학년',
      '2학년',
      '3학년',
    ])

    expect(textbookFilterGradeOptions('고등학교').map(o => o.label)).toEqual([
      '전학년',
      '1학년',
      '2학년',
      '3학년',
    ])

    expect(textbookFilterGradeOptions('대학교')).toEqual([{ label: '전체', value: '전체' }])
  })

  it('교육 대상 미선택 시 옵션 없음', () => {
    expect(textbookFilterGradeOptions('ALL')).toEqual([])
    expect(textbookFilterGradeOptions('')).toEqual([])
  })

  it('등록 옵션은 필터와 동일하며 대학교는 전체', () => {
    expect(textbookRegisterGradeOptions('대학교')).toEqual([{ label: '전체', value: '전체' }])
    expect(textbookRegisterGradeOptions('유아').map(o => o.value)).toEqual([
      '전체',
      '유아',
      '유치원생',
    ])
    expect(textbookRegisterGradeOptions('')).toEqual([])
  })

  it('등록 멀티셀렉트는 전학년을 단독 값으로 접는다', () => {
    expect(parseTextbookRegisterGradeValues('초등학교', '전학년')).toEqual(['전학년'])
    expect(parseTextbookRegisterGradeValues('초등학교', '3-6')).toEqual([
      '3학년',
      '4학년',
      '5학년',
      '6학년',
    ])
    expect(parseTextbookRegisterGradeValues('초등학교', '1학년, 2학년')).toEqual([
      '1학년',
      '2학년',
    ])

    expect(nextTextbookRegisterGradeValues('초등학교', ['1학년'], ['1학년', '전학년'])).toEqual([
      '전학년',
    ])
    expect(nextTextbookRegisterGradeValues('초등학교', ['전학년'], ['전학년', '1학년'])).toEqual([
      '1학년',
    ])
    expect(
      nextTextbookRegisterGradeValues(
        '초등학교',
        ['1학년', '2학년', '3학년', '4학년', '5학년'],
        ['1학년', '2학년', '3학년', '4학년', '5학년', '6학년']
      )
    ).toEqual(['전학년'])

    expect(serializeTextbookRegisterGrades('초등학교', ['전학년'])).toBe('전학년')
    expect(serializeTextbookRegisterGrades('초등학교', ['1학년', '2학년'])).toBe('1학년, 2학년')
    expect(nextTextbookRegisterGradeValues('초등학교', undefined, undefined)).toEqual([])
    expect(nextTextbookRegisterGradeValues('유아', ['전체'], ['전체'])).toEqual(['전체'])
  })

  it('교육 대상이 여럿이면 학년 값을 대상별로 구분한다', () => {
    expect(
      textbookRegisterGradeOptionsForTargets(['초등학교', '중학교']).map(option => option.value)
    ).toEqual([
      '초등학교:전학년',
      '초등학교:1학년',
      '초등학교:2학년',
      '초등학교:3학년',
      '초등학교:4학년',
      '초등학교:5학년',
      '초등학교:6학년',
      '중학교:전학년',
      '중학교:1학년',
      '중학교:2학년',
      '중학교:3학년',
    ])
    expect(
      textbookRegisterGradeOptionsForTargets(['초등학교', '중학교']).find(
        option => option.value === '초등학교:1학년'
      )?.label
    ).toBe('초등학교 1학년')

    expect(
      nextTextbookRegisterGradeValuesForTargets(
        ['초등학교', '중학교'],
        ['초등학교:1학년', '중학교:1학년'],
        ['초등학교:1학년', '초등학교:전학년', '중학교:1학년']
      )
    ).toEqual(['초등학교:전학년', '중학교:1학년'])
    expect(
      nextTextbookRegisterGradeValuesForTargets(['중학교'], ['초등학교:전학년', '중학교:1학년'], [
        '초등학교:전학년',
        '중학교:1학년',
      ])
    ).toEqual(['중학교:1학년'])
    expect(nextTextbookRegisterGradeValuesForTargets(['초등학교'], undefined, undefined)).toEqual([])
    expect(
      nextTextbookRegisterGradeValuesForTargets(
        ['유아', '초등학교'],
        ['유아:전체'],
        ['유아:전체', '초등학교:전학년']
      )
    ).toEqual(['유아:전체', '초등학교:전학년'])
    const gradesByTarget = gradesByTargetFromRegisterValues(
      ['유아', '초등학교', '중학교'],
      ['유아:전체', '초등학교:1학년', '초등학교:2학년', '중학교:전학년']
    )
    expect(gradesByTarget.get('유아')).toEqual(['전체'])
    expect(gradesByTarget.get('초등학교')).toEqual(['1학년', '2학년'])
    expect(gradesByTarget.get('중학교')).toEqual(['전학년'])
  })

  it('교육 대상 변경 시 선택 학년만 유지하고 대학교만 전체를 채운다', () => {
    expect(
      syncTextbookRegisterGradesAfterTargetsChange(
        ['유아', '초등학교'],
        ['유아:전체', '중학교:1학년']
      )
    ).toEqual(['유아:전체'])
    expect(
      syncTextbookRegisterGradesAfterTargetsChange(['대학교'], [])
    ).toEqual(['대학교:전체'])
  })

  it('표시 라벨·다중 대상 요약을 대상별 셀렉트 값으로 복원한다', () => {
    expect(decodeTextbookRegisterGradeValue('유아 전체')).toEqual({
      target: '유아',
      grade: '전체',
    })
    expect(decodeTextbookRegisterGradeValue('초등학교:1학년')).toEqual({
      target: '초등학교',
      grade: '1학년',
    })
    expect(
      parseTextbookRegisterGradeValuesForTargets(
        ['유아', '초등학교', '중학교'],
        '유아 전체, 초등학교 전학년, 중학교 1학년, 2학년'
      )
    ).toEqual(['유아:전체', '초등학교:전학년', '중학교:1학년', '중학교:2학년'])
  })
})
