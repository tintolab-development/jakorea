import { describe, expect, it } from 'vitest'
import {
  areTermsTypesEquivalent,
  normalizeTermsTypeAliasGroup,
  resolveTermsTypesForCurrentLookup,
} from './terms-document-type-alias'

describe('terms-document-type-alias', () => {
  it('지급조서 PRE_CONSENT / CONSENT / PAYMENT_STATEMENT 를 동일 그룹으로 본다', () => {
    expect(
      areTermsTypesEquivalent('PAYMENT_STATEMENT_CONSENT', 'PAYMENT_STATEMENT_PRE_CONSENT')
    ).toBe(true)
    expect(areTermsTypesEquivalent('PAYMENT_STATEMENT', 'PAYMENT_STATEMENT_CONSENT')).toBe(true)
    expect(normalizeTermsTypeAliasGroup('PAYMENT_STATEMENT_PRE_CONSENT')).toBe(
      'PAYMENT_STATEMENT_CONSENT'
    )
  })

  it('current lookup 후보는 원본 type을 우선한다', () => {
    expect(resolveTermsTypesForCurrentLookup('PAYMENT_STATEMENT_CONSENT')).toEqual([
      'PAYMENT_STATEMENT_CONSENT',
      'PAYMENT_STATEMENT_PRE_CONSENT',
      'PAYMENT_STATEMENT',
    ])
    expect(resolveTermsTypesForCurrentLookup('PAYMENT_STATEMENT_PRE_CONSENT')).toEqual([
      'PAYMENT_STATEMENT_PRE_CONSENT',
      'PAYMENT_STATEMENT_CONSENT',
      'PAYMENT_STATEMENT',
    ])
  })

  it('별칭 그룹 밖 type은 자기 자신만 조회한다', () => {
    expect(resolveTermsTypesForCurrentLookup('MARKETING')).toEqual(['MARKETING'])
    expect(areTermsTypesEquivalent('MARKETING', 'PORTRAIT_RIGHTS')).toBe(false)
  })
})
