import { describe, expect, it } from 'vitest'
import {
  formatNotificationDate,
  notificationBodyFirstLine,
  resolveNotificationSubLine,
} from './notification-inbox-display'

describe('formatNotificationDate', () => {
  it('YYYY.MM.DD (로컬 날짜, 0 채움, 시간 없음)', () => {
    expect(formatNotificationDate(new Date(2026, 0, 5, 9, 7))).toBe('2026.01.05')
    expect(formatNotificationDate(new Date(2026, 10, 12, 23, 59))).toBe('2026.11.12')
  })

  it('해석할 수 없는 값은 빈 문자열', () => {
    expect(formatNotificationDate('not-a-date')).toBe('')
  })
})

describe('notificationBodyFirstLine', () => {
  it('앞쪽 빈 줄을 건너뛰고 첫 줄만 돌려준다', () => {
    expect(notificationBodyFirstLine('\n  첫 줄 \r\n둘째 줄')).toBe('첫 줄')
  })

  it('본문이 없으면 빈 문자열', () => {
    expect(notificationBodyFirstLine('')).toBe('')
    expect(notificationBodyFirstLine(undefined)).toBe('')
    expect(notificationBodyFirstLine(' \n ')).toBe('')
  })
})

describe('resolveNotificationSubLine', () => {
  it('프로그램명이 있으면 프로그램명', () => {
    expect(resolveNotificationSubLine({ programName: '프로그램 A', body: '본문' })).toEqual({
      text: '프로그램 A',
      source: 'program',
    })
  })

  it('프로그램명이 없으면 본문 첫 줄', () => {
    expect(resolveNotificationSubLine({ programName: ' ', body: '첫 줄\n둘째 줄' })).toEqual({
      text: '첫 줄',
      source: 'body',
    })
  })

  it('둘 다 없으면 빈 줄', () => {
    expect(resolveNotificationSubLine({ body: '' })).toEqual({ text: '', source: 'none' })
  })
})
