import { describe, expect, it } from 'vitest'
import { isNotifyAnnouncementOptionDisabled, isNotifyAnnouncementPassed } from './notify-announcement'

describe('isNotifyAnnouncementPassed — 서울 기준 발표일 경과', () => {
  it('발표일 값이 없거나 해석할 수 없으면 경과로 보지 않는다(기존 동작 유지)', () => {
    const now = new Date('2026-11-12T03:00:00Z')
    expect(isNotifyAnnouncementPassed(null, now)).toBe(false)
    expect(isNotifyAnnouncementPassed(undefined, now)).toBe(false)
    expect(isNotifyAnnouncementPassed('', now)).toBe(false)
    expect(isNotifyAnnouncementPassed('not-a-date', now)).toBe(false)
  })

  it('서울 00:00 발표일(날짜만 지정)은 그날이 끝난 뒤에 경과한다', () => {
    // 2026-11-16T15:00:00Z = 서울 2026-11-17 00:00
    const announcementAt = '2026-11-16T15:00:00Z'
    expect(isNotifyAnnouncementPassed(announcementAt, new Date('2026-11-16T14:59:00Z'))).toBe(false)
    // 서울 2026-11-17 23:59 — 발표일 당일
    expect(isNotifyAnnouncementPassed(announcementAt, new Date('2026-11-17T14:59:00Z'))).toBe(false)
    // 서울 2026-11-18 00:00 — 발표일 다음 날
    expect(isNotifyAnnouncementPassed(announcementAt, new Date('2026-11-17T15:00:00Z'))).toBe(true)
  })

  it('시각이 있는 발표일은 그 시각이 지나면 경과한다', () => {
    // 서울 2026-11-08 20:51
    const announcementAt = '2026-11-08T11:51:00Z'
    expect(isNotifyAnnouncementPassed(announcementAt, new Date('2026-11-08T11:50:59Z'))).toBe(false)
    expect(isNotifyAnnouncementPassed(announcementAt, new Date('2026-11-08T11:51:01Z'))).toBe(true)
  })

  it('YYYY-MM-DD만 오면 서울 그날로 본다', () => {
    expect(isNotifyAnnouncementPassed('2026-11-11', new Date('2026-11-11T14:00:00Z'))).toBe(false)
    expect(isNotifyAnnouncementPassed('2026-11-11', new Date('2026-11-11T15:00:00Z'))).toBe(true)
  })
})

describe('isNotifyAnnouncementOptionDisabled — 발표일을 아는 화면의 비활성', () => {
  const now = new Date('2026-11-12T03:00:00Z')

  it('미설정(null)·해석 불가·경과는 비활성', () => {
    expect(isNotifyAnnouncementOptionDisabled(null, now)).toBe(true)
    expect(isNotifyAnnouncementOptionDisabled(undefined, now)).toBe(true)
    expect(isNotifyAnnouncementOptionDisabled('', now)).toBe(true)
    expect(isNotifyAnnouncementOptionDisabled('not-a-date', now)).toBe(true)
    expect(isNotifyAnnouncementOptionDisabled('2026-11-10T15:00:00Z', now)).toBe(true)
  })

  it('남은 발표일은 선택 가능', () => {
    expect(isNotifyAnnouncementOptionDisabled('2026-11-12T15:00:00Z', now)).toBe(false)
    // 발표일 당일(서울 11-12 00:00 지정)
    expect(isNotifyAnnouncementOptionDisabled('2026-11-11T15:00:00Z', now)).toBe(false)
  })
})
