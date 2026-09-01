import { describe, expect, it } from 'vitest'
import {
  mapBugIssueLogListPageResponse,
  mapBugIssueLogResponse,
  mapDownloadLogListPageResponse,
  mapDownloadLogResponse,
  mapMemberLoginLogListPageResponse,
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

  it('maps download log page wrapper and does not use items.length as total', () => {
    const page = mapDownloadLogListPageResponse({
      items: [{ id: '1', fileName: 'a.pdf', userName: '홍길동' }],
      page: 1,
      size: 20,
      totalElements: 41,
      totalPages: 3,
      hasNext: true,
    })
    expect(page.items).toHaveLength(1)
    expect(page.page).toBe(1)
    expect(page.totalElements).toBe(41)
    expect(page.hasNext).toBe(true)
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

    const page = mapMemberLoginLogListPageResponse({
      items: [{ id: '1', adminName: '이영희', loginId: 'a@b.c' }],
      page: 0,
      size: 20,
      totalElements: 1,
      totalPages: 1,
      hasNext: false,
    })
    expect(page.items).toHaveLength(1)
    expect(page.items[0]?.adminName).toBe('이영희')
    expect(page.totalElements).toBe(1)
  })

  it('maps bug issue log and numeric id', () => {
    const row = mapBugIssueLogResponse({
      id: 42,
      screenName: '대시보드',
      errorMessage: '500',
    })
    expect(row.id).toBe('42')
    expect(row.screenName).toBe('대시보드')
    expect(row.errorMessage).toBe('500')
  })

  it('maps bug issue page wrapper', () => {
    const page = mapBugIssueLogListPageResponse({
      items: [{ id: 1, screenName: '대시보드', errorMessage: '500' }],
      page: 0,
      size: 20,
      totalElements: 55,
      totalPages: 3,
      hasNext: true,
    })
    expect(page.items[0]?.id).toBe('1')
    expect(page.totalElements).toBe(55)
    expect(page.hasNext).toBe(true)
  })
})
