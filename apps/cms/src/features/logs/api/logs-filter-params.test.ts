import { describe, expect, it } from 'vitest'
import {
  bugIssueLogsParamsFromSearchParams,
  fileDownloadLogsParamsFromSearchParams,
  memberLoginLogsParamsFromSearchParams,
  personalInfoAccessLogsParamsFromSearchParams,
} from './logs-filter-params'
import { toLogsListQueryParams, toLogsQueryParams } from './logs-api-client'

describe('logs-filter-params', () => {
  it('maps member login URL params to API params', () => {
    const params = memberLoginLogsParamsFromSearchParams(
      new URLSearchParams('mlh_name=홍길동&mlh_id=helpdesk2023@gmail.com&mlh_from=2026-01-01&mlh_to=2026-01-31')
    )
    expect(params).toEqual({
      adminName: '홍길동',
      loginId: 'helpdesk2023@gmail.com',
      from: '2026-01-01',
      to: '2026-01-31',
    })
  })

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

  it('maps optional privacy targetName and issue status/severity', () => {
    expect(
      personalInfoAccessLogsParamsFromSearchParams(new URLSearchParams('pia_target=홍길동'))
    ).toEqual({ targetName: '홍길동' })
    expect(
      bugIssueLogsParamsFromSearchParams(
        new URLSearchParams('bil_status=OPEN&bil_severity=HIGH')
      )
    ).toEqual({ status: 'OPEN', severity: 'HIGH' })
  })

  it('adds 0-base page and clamped size as top-level query keys', () => {
    const filters = toLogsQueryParams({
      adminName: '홍길동',
      from: '2026-08-01',
      to: '2026-08-25',
      page: '99',
      size: '999',
    })
    expect(filters).toEqual({
      adminName: '홍길동',
      from: '2026-08-01',
      to: '2026-08-25',
    })
    expect(toLogsListQueryParams(filters, 1, 20)).toEqual({
      adminName: '홍길동',
      from: '2026-08-01',
      to: '2026-08-25',
      page: '1',
      size: '20',
    })
    expect(toLogsListQueryParams({}, 0, 200).size).toBe('100')
  })
})
