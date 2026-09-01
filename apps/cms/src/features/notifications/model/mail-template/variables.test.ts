import { describe, expect, it } from 'vitest'
import {
  MAIL_TEMPLATE_VARIABLE_GROUPS,
  filterMailVariableGroups,
  formatMailVariableToken,
  getMailVariableLabel,
} from './variables'

describe('MAIL_TEMPLATE_VARIABLE_GROUPS', () => {
  it('matches the design: 11 categories and 72 variables', () => {
    expect(MAIL_TEMPLATE_VARIABLE_GROUPS).toHaveLength(11)
    const total = MAIL_TEMPLATE_VARIABLE_GROUPS.reduce(
      (count, group) => count + group.items.length,
      0
    )
    expect(total).toBe(72)
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
