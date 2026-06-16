import { describe, expect, it } from 'vitest'
import {
  bugIssueLogsParamsFromSearchParams,
  fileDownloadLogsParamsFromSearchParams,
  personalInfoAccessLogsParamsFromSearchParams,
} from './logs-filter-params'

describe('logs-filter-params', () => {
  it('maps file download URL params to API params', () => {
    const params = fileDownloadLogsParamsFromSearchParams(
      new URLSearchParams('fdl_file=report.pdf&fdl_user=홍길동&fdl_from=2026-01-01&fdl_to=2026-01-31')
    )
    expect(params).toEqual({
      fileName: 'report.pdf',
      userName: '홍길동',
      from: '2026-01-01',
      to: '2026-01-31',
    })
  })

  it('maps personal info access URL params to API params', () => {
    const params = personalInfoAccessLogsParamsFromSearchParams(
      new URLSearchParams('pia_purpose=업무&pia_accessor=관리자&pia_from=2026-02-01&pia_to=2026-02-28')
    )
    expect(params).toEqual({
      accessPurpose: '업무',
      accessorName: '관리자',
      from: '2026-02-01',
      to: '2026-02-28',
    })
  })

  it('maps bug issue URL params to API params', () => {
    const params = bugIssueLogsParamsFromSearchParams(
      new URLSearchParams('bil_user=테스터&bil_from=2026-03-01&bil_to=2026-03-31')
    )
    expect(params).toEqual({
      userName: '테스터',
      from: '2026-03-01',
      to: '2026-03-31',
    })
  })
})
