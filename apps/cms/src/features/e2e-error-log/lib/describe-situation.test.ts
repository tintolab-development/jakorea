import { describe, expect, it } from 'vitest'
import { describeE2eErrorSituation } from '@/features/e2e-error-log/lib/describe-situation'

describe('describeE2eErrorSituation', () => {
  it('labels general program registration steps', () => {
    expect(describeE2eErrorSituation('/programs/general', '?new=1')).toBe(
      '일반 프로그램 등록 · 공통 정보'
    )
    expect(describeE2eErrorSituation('/programs/general', '?new=1&generalStep=recruit-1')).toBe(
      '일반 프로그램 등록 · 모집 정보'
    )
  })

  it('falls back to pathname', () => {
    expect(describeE2eErrorSituation('/unknown/path')).toBe('/unknown/path')
  })
})
