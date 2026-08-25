import { describe, expect, it } from 'vitest'
import dayjs from 'dayjs'
import { buildMemberLoginHistoryExcelFilename } from './member-login-excel'

describe('member-login-excel', () => {
  it('builds the spec filename with YYMMDD', () => {
    expect(buildMemberLoginHistoryExcelFilename(dayjs('2026-08-24'))).toBe(
      '[JA Korea] CMS 어드민_회원 로그인 이력_260824'
    )
  })
})
