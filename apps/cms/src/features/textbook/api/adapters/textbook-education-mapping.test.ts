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
