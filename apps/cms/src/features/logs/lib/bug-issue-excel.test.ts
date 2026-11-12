import { describe, expect, it } from 'vitest'
import dayjs from 'dayjs'
import { buildBugIssueHistoryExcelFilename } from './bug-issue-excel'

describe('bug-issue-excel', () => {
  it('builds the spec filename with YYMMDD', () => {
    expect(buildBugIssueHistoryExcelFilename(dayjs('2026-10-23'))).toBe(
      '[JA Korea] CMS 어드민_버그&이슈 이력_261023'
    )
  })
})

describe('buildBugIssueHistoryExcelFilename 서울 날짜', () => {
  it('오전 9시 전(UTC 전날)에도 서울 날짜를 쓴다', () => {
    expect(buildBugIssueHistoryExcelFilename(new Date('2026-11-09T23:30:00Z'))).toBe(
      '[JA Korea] CMS 어드민_버그&이슈 이력_261110'
    )
  })
})
