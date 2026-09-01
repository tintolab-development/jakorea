import { describe, expect, it } from 'vitest'
import { companySchoolQueryKeys } from '@/features/program/1c-1s/api/query-keys'
import { generalProgramQueryKeys } from './general-program-query-keys'

function isPrefixedBy(key: readonly unknown[], prefix: readonly unknown[]): boolean {
  return prefix.every((part, index) => key[index] === part)
}

describe('program mutation invalidate prefixes', () => {
  it('general program lists prefix matches list queries only', () => {
    const lists = generalProgramQueryKeys.lists()

    expect(isPrefixedBy(generalProgramQueryKeys.list(null), lists)).toBe(true)
    expect(isPrefixedBy(generalProgramQueryKeys.list('open', 'filters'), lists)).toBe(true)
    expect(isPrefixedBy(generalProgramQueryKeys.detail('p1'), lists)).toBe(false)
    expect(isPrefixedBy(generalProgramQueryKeys.posts('p1'), lists)).toBe(false)
    expect(isPrefixedBy(generalProgramQueryKeys.surveys('p1'), lists)).toBe(false)
    expect(isPrefixedBy(generalProgramQueryKeys.managers('p1'), lists)).toBe(false)
  })

  it('1c-1s lists prefix does not match sibling details or overview', () => {
    const lists = companySchoolQueryKeys.lists()

    expect(isPrefixedBy(companySchoolQueryKeys.list('filters'), lists)).toBe(true)
    expect(isPrefixedBy(companySchoolQueryKeys.detail('p1'), lists)).toBe(false)
    expect(isPrefixedBy(companySchoolQueryKeys.overviewStages(), lists)).toBe(false)
  })
})
