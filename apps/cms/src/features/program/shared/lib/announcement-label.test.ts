import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'
import {
  formatAnnouncementLabel,
  parseAnnouncementLabel,
  resolveAnnouncement,
} from '@/features/program/shared/lib/announcement-label'

describe('announcement-label', () => {
  it('날짜·방법 중 하나만 있어도 라벨을 만든다', () => {
    expect(formatAnnouncementLabel('2026-10-08T00:00:00+09:00', '홈페이지 공지')).toBe(
      '2026.10.08(목) | 홈페이지 공지'
    )
    expect(formatAnnouncementLabel(undefined, '홈페이지 공지')).toBe('홈페이지 공지')
    expect(formatAnnouncementLabel('2026-10-08T00:00:00+09:00', ' ')).toBe('2026.10.08(목)')
    expect(formatAnnouncementLabel(undefined, '-')).toBeUndefined()
  })

  it('라벨을 날짜·방법으로 쪼갠다 (방법만 있는 라벨도 방법을 잃지 않는다)', () => {
    const both = parseAnnouncementLabel('2026.10.08(목) | ○○○')
    expect(dayjs(both.date).format('YYYY-MM-DD')).toBe('2026-10-08')
    expect(both.method).toBe('○○○')
    expect(parseAnnouncementLabel('2026.10.08(목) | 공지 | 개별 연락').method).toBe(
      '공지 | 개별 연락'
    )
    expect(parseAnnouncementLabel('홈페이지 공지')).toEqual({ method: '홈페이지 공지' })
    expect(parseAnnouncementLabel('2026.10.08(목)').method).toBeUndefined()
    expect(parseAnnouncementLabel('-')).toEqual({})
  })

  it('조회 — 모집별 라벨 우선, 빈 부분은 컬럼으로 채운다', () => {
    const resolved = resolveAnnouncement({
      labels: ['홈페이지 공지'],
      column: { date: '2026-10-08T00:00:00+09:00', method: '컬럼 방법' },
    })
    expect(resolved.method).toBe('홈페이지 공지')
    expect(dayjs(resolved.date).format('YYYY-MM-DD')).toBe('2026-10-08')
  })
})
