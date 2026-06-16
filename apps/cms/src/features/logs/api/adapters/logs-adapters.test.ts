import { describe, expect, it } from 'vitest'
import {
  mapBugIssueLogResponse,
  mapDownloadLogResponse,
  mapPersonalInfoAccessLogResponse,
  mapSystemIssueDetailResponse,
} from './logs-adapters'

describe('logs-adapters', () => {
  it('maps download log with defaults', () => {
    const row = mapDownloadLogResponse({
      id: '1',
      fileName: 'report.pdf',
      userName: '홍길동',
      downloadedAt: '2026-01-01T00:00:00Z',
    })
    expect(row.fileName).toBe('report.pdf')
    expect(row.userName).toBe('홍길동')
  })

  it('maps personal info access log', () => {
    const row = mapPersonalInfoAccessLogResponse({
      accessItem: '연락처',
      accessorName: '관리자',
    })
    expect(row.accessItem).toBe('연락처')
    expect(row.accessorName).toBe('관리자')
  })

  it('maps bug issue log', () => {
    const row = mapBugIssueLogResponse({
      screenName: '대시보드',
      errorMessage: '500',
    })
    expect(row.screenName).toBe('대시보드')
    expect(row.errorMessage).toBe('500')
  })

  it('maps system issue detail', () => {
    const detail = mapSystemIssueDetailResponse({
      issueId: 42,
      issueStatus: 'OPEN',
      stackTraceAvailable: true,
    })
    expect(detail.issueId).toBe(42)
    expect(detail.issueStatus).toBe('OPEN')
    expect(detail.stackTraceAvailable).toBe(true)
  })
})
