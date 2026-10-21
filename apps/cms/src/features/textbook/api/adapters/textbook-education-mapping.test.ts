import { describe, expect, it } from 'vitest'
import { mapTextbookResponse } from './textbook-adapters'
import {
  buildEducationStages,
  toEducationStageKey,
} from '@/features/textbook/lib/textbook-education-stages'

describe('textbook education stage mapping', () => {
  it('maps English ELEMENTARY educationTarget to elementary stage', () => {
    expect(toEducationStageKey('ELEMENTARY')).toBe('elementary')
    const stages = buildEducationStages('ELEMENTARY', '3학년')
    const el = stages.find(s => s.key === 'elementary')!
    expect(el.grades?.find(g => g.label === '3학년')?.selected).toBe(true)
  })

  it('maps Korean educationTarget + grade labels', () => {
    const stages = buildEducationStages('초등학교', '3학년')
    const el = stages.find(s => s.key === 'elementary')!
    expect(el.grades?.find(g => g.label === '3학년')?.selected).toBe(true)
  })

  it('maps OpenAPI-style grade range 3-6 to grade checkboxes', () => {
    const stages = buildEducationStages('초등학교', '3-6')
    const el = stages.find(s => s.key === 'elementary')!
    expect(el.grades?.filter(g => g.selected).map(g => g.label)).toEqual([
      '3학년',
      '4학년',
      '5학년',
      '6학년',
    ])
    expect(el.selected).toBe(false)
  })

  it('adapter maps ELEMENTARY / 3-6 into checked stages', () => {
    const row = mapTextbookResponse({
      id: '1',
      businessArea: '진로취업',
      educationTarget: 'ELEMENTARY',
      grade: '3-6',
      textbookName: '나의 미래 직업 탐험',
      textbookNameEn: 'Career Discovery',
      useStatus: 'USED',
    })
    expect(row.educationTarget).toBe('초등학교')
    const el = row.educationStages.find(s => s.key === 'elementary')!
    expect(el.grades?.filter(g => g.selected).map(g => g.label)).toEqual([
      '3학년',
      '4학년',
      '5학년',
      '6학년',
    ])
  })

  it('normalizes numeric educationStages grade tokens without wiping fallback', () => {
    const row = mapTextbookResponse({
      id: '1',
      businessArea: '진로취업',
      educationTarget: '초등학교',
      grade: '3학년',
      educationStages: [{ stage: 'elementary', grades: ['3', '4', '5', '6'] }],
      textbookName: 'x',
      useStatus: 'USED',
    })
    const el = row.educationStages.find(s => s.key === 'elementary')!
    expect(el.grades?.filter(g => g.selected).map(g => g.label)).toEqual([
      '3학년',
      '4학년',
      '5학년',
      '6학년',
    ])
  })

  it('일부 학년만 선택된 목록 대상 학년은 상세 체크와 같다', () => {
    const row = mapTextbookResponse({
      id: '1',
      businessArea: '기업가정신',
      educationTarget: '초등학교',
      grade: '전학년',
      educationStages: [{ stage: 'elementary', grades: ['1', '2', '3', '4'] }],
      textbookName: '초등 부분 학년',
      useStatus: 'USED',
    })
    expect(row.educationTarget).toBe('초등학교')
    expect(row.grade).toBe('1학년, 2학년, 3학년, 4학년')
    const el = row.educationStages.find(s => s.key === 'elementary')!
    expect(el.selected).toBe(false)
    expect(el.grades?.filter(g => g.selected).map(g => g.label)).toEqual([
      '1학년',
      '2학년',
      '3학년',
      '4학년',
    ])
  })

  it('초등 학년이 모두 선택된 경우에만 전학년이다', () => {
    const row = mapTextbookResponse({
      id: '1',
      businessArea: '기업가정신',
      educationTarget: '초등학교',
      grade: '1학년',
      educationStages: [{ stage: 'elementary', grades: ['1', '2', '3', '4', '5', '6'] }],
      textbookName: '초등 전학년',
      useStatus: 'USED',
    })
    expect(row.grade).toBe('전학년')
  })

  it('쉼표로 이어진 학년 요약도 같은 체크로 복원한다', () => {
    const stages = buildEducationStages('초등학교', '1학년, 2학년, 3학년, 4학년')
    const el = stages.find(s => s.key === 'elementary')!
    expect(el.selected).toBe(false)
    expect(el.grades?.filter(g => g.selected).map(g => g.label)).toEqual([
      '1학년',
      '2학년',
      '3학년',
      '4학년',
    ])
  })

  it('empty educationTarget/grade leaves all unchecked', () => {
    const row = mapTextbookResponse({
      id: '1',
      businessArea: '진로취업',
      textbookName: 'x',
      useStatus: 'USED',
    })
    expect(
      row.educationStages.every(s => !s.selected && !(s.grades?.some(g => g.selected)))
    ).toBe(true)
  })
})
