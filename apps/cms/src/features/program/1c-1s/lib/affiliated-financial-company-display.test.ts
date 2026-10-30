/** @vitest-environment node */
import { describe, expect, it } from 'vitest'
import { resolveAffiliatedFinancialCompanyDisplay } from './affiliated-financial-company-display'

describe('resolveAffiliatedFinancialCompanyDisplay', () => {
  it('Java Map 문자열 partner → 프로그램 후원사 표시', () => {
    expect(
      resolveAffiliatedFinancialCompanyDisplay('{companyType=partner, customCompanyName=}')
    ).toEqual({ kind: 'partner' })
  })

  it('none → 미결연, custom → 기타 입력값', () => {
    expect(
      resolveAffiliatedFinancialCompanyDisplay('{companyType=none, customCompanyName=}')
    ).toEqual({ kind: 'text', text: '미결연' })
    expect(
      resolveAffiliatedFinancialCompanyDisplay('{companyType=custom, customCompanyName=우리은행}')
    ).toEqual({ kind: 'text', text: '우리은행' })
    expect(
      resolveAffiliatedFinancialCompanyDisplay(
        '{"companyType":"custom","customCompanyName":"하나은행"}'
      )
    ).toEqual({ kind: 'text', text: '하나은행' })
    expect(
      resolveAffiliatedFinancialCompanyDisplay('{companyType=custom, customCompanyName=}')
    ).toEqual({ kind: 'empty' })
  })

  it('이미 사람이 읽는 회사명은 그대로, 빈 값은 empty', () => {
    expect(resolveAffiliatedFinancialCompanyDisplay('신한은행')).toEqual({
      kind: 'text',
      text: '신한은행',
    })
    expect(resolveAffiliatedFinancialCompanyDisplay('  ')).toEqual({ kind: 'empty' })
    expect(resolveAffiliatedFinancialCompanyDisplay(undefined)).toEqual({ kind: 'empty' })
  })
})

describe('resolveAffiliatedFinancialCompanyDisplay — BE 정규 문자열', () => {
  it('미결연·후원사명·후원사·기타 입력값은 그대로 표시한다', () => {
    for (const text of ['미결연', '스타벅스', '후원사', '우리은행']) {
      expect(resolveAffiliatedFinancialCompanyDisplay(text)).toEqual({ kind: 'text', text })
    }
  })
})
