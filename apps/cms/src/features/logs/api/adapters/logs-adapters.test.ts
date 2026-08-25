import { describe, expect, it } from 'vitest'
import {
  mapBugIssueLogResponse,
  mapDownloadLogResponse,
  mapMemberLoginLogListResponse,
  mapMemberLoginLogResponse,
  mapPersonalInfoAccessLogResponse,
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
    expect(row.targetName).toBe('-')
  })

  it('maps optional privacy targetName from extra DTO fields', () => {
    const row = mapPersonalInfoAccessLogResponse({
      accessItem: '연락처',
      accessorName: '관리자',
      targetName: '홍길동',
    } as Parameters<typeof mapPersonalInfoAccessLogResponse>[0] & { targetName: string })
    expect(row.targetName).toBe('홍길동')
  })

  it('maps member login log', () => {
    const row = mapMemberLoginLogResponse({
      id: 12,
      adminName: '홍길동',
      loginId: 'helpdesk2023@gmail.com',
      loggedAt: '2026-03-30T01:10:32Z',
      ip: '14.90.80.100',
    })
    expect(row.id).toBe('12')
    expect(row.adminName).toBe('홍길동')
    expect(row.loginId).toBe('helpdesk2023@gmail.com')
    expect(row.loggedAt).toBe('2026-03-30T01:10:32Z')
    expect(row.ipAddress).toBe('14.90.80.100')
    expect(row.ipAddress).not.toMatch(/x/i)
  })

  it('maps member login log extra keys and list envelope', () => {
    const row = mapMemberLoginLogResponse({
      name: '김철수',
      email: 'admin.kim@jakorea.org',
      loginAt: '2026-03-29T10:00:00Z',
      ipAddress: '10.0.0.1',
    })
    expect(row.adminName).toBe('김철수')
    expect(row.loginId).toBe('admin.kim@jakorea.org')
    expect(row.loggedAt).toBe('2026-03-29T10:00:00Z')
    expect(row.ipAddress).toBe('10.0.0.1')

    const rows = mapMemberLoginLogListResponse({
      items: [{ id: '1', adminName: '이영희', loginId: 'a@b.c' }],
    })
    expect(rows).toHaveLength(1)
    expect(rows[0]?.adminName).toBe('이영희')
  })

  it('maps bug issue log', () => {
    const row = mapBugIssueLogResponse({
      screenName: '대시보드',
      errorMessage: '500',
    })
    expect(row.screenName).toBe('대시보드')
    expect(row.errorMessage).toBe('500')
  })
})
