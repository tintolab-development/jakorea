import { describe, expect, it } from 'vitest'
import {
  MAIL_TEMPLATE_VARIABLE_GROUPS,
  filterMailVariableGroups,
  formatMailVariableToken,
  getMailVariableLabel,
  groupMailTemplateVariablesFromCatalog,
  getMailVariablePanelNote,
} from './variables'

describe('MAIL_TEMPLATE_VARIABLE_GROUPS', () => {
  it('matches the design: 11 categories and 73 variables (+ BE N2 교육 진행 회차)', () => {
    expect(MAIL_TEMPLATE_VARIABLE_GROUPS).toHaveLength(11)
    const total = MAIL_TEMPLATE_VARIABLE_GROUPS.reduce(
      (count, group) => count + group.items.length,
      0
    )
    expect(total).toBe(73)
  })

  it('does not include variables outside the design spec', () => {
    const labels = MAIL_TEMPLATE_VARIABLE_GROUPS.flatMap(group =>
      group.items.map(getMailVariableLabel)
    )
    expect(labels).not.toContain('서비스명')
  })

  it('includes design-specific labels', () => {
    const labels = MAIL_TEMPLATE_VARIABLE_GROUPS.flatMap(group =>
      group.items.map(getMailVariableLabel)
    )
    expect(labels).toContain('UJAT 상반기 봉사자 모집 기간')
    expect(labels).toContain('면접 배정일')
    expect(labels).toContain('영수증 제출 마감일')
    expect(labels).toContain('봉사자 모집 문의처 메일')
  })

  it('adds a hint only for settlement amount', () => {
    const amountGroup = MAIL_TEMPLATE_VARIABLE_GROUPS.find(group => group.id === 'amount')
    expect(amountGroup?.items).toEqual([
      { label: '학생 교통비' },
      { label: '활동비' },
      { label: '정산금액', hint: '*세금 미제외 금액' },
    ])
  })
})

describe('교육 진행 차시 · 교육 진행 회차 (BE N2)', () => {
  it('시간 그룹에 차시(개수)와 회차(번호)를 구분해 둔다', () => {
    const time = MAIL_TEMPLATE_VARIABLE_GROUPS.find(group => group.id === 'time')
    expect(time?.items.map(getMailVariableLabel)).toEqual([
      '교육 진행 수업 시간',
      '교육 진행 차시',
      '교육 진행 회차',
    ])
    expect(time?.items[1]?.hint).toContain('정산 인정 차시')
    expect(time?.items[1]?.hint).toContain('#{교육 진행 회차}')
    expect(getMailVariablePanelNote('교육 진행 차시')).toBe('차시 개수 · 회차는 #{교육 진행 회차}')
    expect(getMailVariablePanelNote('교육 진행 회차')).toBe('회차 번호(N회차)')
    expect(getMailVariablePanelNote('회원명')).toBeUndefined()
  })

  it('카탈로그 설명보다 FE 차시 설명을 우선하고, 카탈로그에 없는 변수는 끼워 넣지 않는다', () => {
    const groups = groupMailTemplateVariablesFromCatalog([
      {
        key: '교육 진행 차시',
        description: '교육 진행 차시',
        requiresProgram: true,
        enabled: false,
        categoryCode: 'TIME',
        categoryLabel: '시간',
      },
    ])
    expect(groups[0]?.items).toHaveLength(1)
    expect(groups[0]?.items[0]?.hint).toContain('차시 개수')
  })
})

describe('filterMailVariableGroups', () => {
  it('filters by token label and hint text', () => {
    const filtered = filterMailVariableGroups(MAIL_TEMPLATE_VARIABLE_GROUPS, '세금')
    expect(filtered).toHaveLength(1)
    expect(filtered[0]?.id).toBe('amount')
    expect(filtered[0]?.items).toHaveLength(1)
    expect(getMailVariableLabel(filtered[0]!.items[0]!)).toBe('정산금액')
  })

  it('filters by formatted token', () => {
    const filtered = filterMailVariableGroups(MAIL_TEMPLATE_VARIABLE_GROUPS, '#{회원명}')
    expect(filtered[0]?.items.map(getMailVariableLabel)).toContain('회원명')
  })

  it('formats tokens consistently', () => {
    expect(formatMailVariableToken('회원명')).toBe('#{회원명}')
  })
})

describe('groupMailTemplateVariablesFromCatalog', () => {
  it('passes through BE enabled without local recalculation', () => {
    const groups = groupMailTemplateVariablesFromCatalog([
      {
        key: '회원명',
        description: '회원 이름',
        requiresProgram: false,
        enabled: true,
        categoryCode: 'name',
        categoryLabel: '이름',
      },
      {
        key: '프로그램명',
        description: '프로그램',
        requiresProgram: true,
        enabled: false,
        categoryCode: 'name',
        categoryLabel: '이름',
      },
    ])
    expect(groups).toEqual([
      {
        id: 'name',
        label: '이름',
        items: [
          { label: '회원명', hint: '회원 이름', enabled: true },
          {
            label: '프로그램명',
            hint: '프로그램',
            requiresProgram: true,
            enabled: false,
          },
        ],
      },
    ])
  })
})
