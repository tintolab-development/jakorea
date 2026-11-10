import { describe, expect, it } from 'vitest'
import dayjs from 'dayjs'
import { buildBugIssueHistoryExcelFilename } from './bug-issue-excel'

describe('bug-issue-excel', () => {
  it('builds the spec filename with YYMMDD', () => {
    expect(buildBugIssueHistoryExcelFilename(dayjs('2026-10-23'))).toBe(
      '[JA Korea] CMS 어드민_버그,이슈 이력_261023'
    )
  })
})
