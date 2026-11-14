import { describe, expect, it } from 'vitest'
import {
  formatActivityCertificateHours,
  formatActivityCertificateParticipationPeriod,
  resolveActivityCertificatePeriodHours,
} from './activity-certificate-period-hours'

describe('formatActivityCertificateHours', () => {
  it('null·0 → -', () => {
    expect(formatActivityCertificateHours(null)).toBe('-')
    expect(formatActivityCertificateHours(undefined)).toBe('-')
    expect(formatActivityCertificateHours(0)).toBe('-')
  })

  it('60의 배수 → 총 N시간, 그 외 → 총 N시간 M분', () => {
    expect(formatActivityCertificateHours(240)).toBe('총 4시간')
    expect(formatActivityCertificateHours(120)).toBe('총 2시간')
    expect(formatActivityCertificateHours(270)).toBe('총 4시간 30분')
    expect(formatActivityCertificateHours(330)).toBe('총 5시간 30분')
  })

  it('1시간 미만 → 총 M분 (기획 회신 261113)', () => {
    expect(formatActivityCertificateHours(30)).toBe('총 30분')
    expect(formatActivityCertificateHours(59)).toBe('총 59분')
  })
})

describe('formatActivityCertificateParticipationPeriod', () => {
  it('둘 다 없음 → -', () => {
    expect(formatActivityCertificateParticipationPeriod(null, null)).toBe('-')
    expect(formatActivityCertificateParticipationPeriod(undefined, undefined)).toBe('-')
  })

  it('다른 날짜 → 기간, 같은 날 → 날짜 하나(물결표 없음)', () => {
    expect(formatActivityCertificateParticipationPeriod('2026-11-02', '2026-11-09')).toBe(
      '2026.11.02 ~ 2026.11.09'
    )
    expect(formatActivityCertificateParticipationPeriod('2026-11-12', '2026-11-12')).toBe('2026.11.12')
  })

  it('타임존 변환 없이 문자열 그대로 — 연초·연말 경계도 하루 밀리지 않는다', () => {
    expect(formatActivityCertificateParticipationPeriod('2026-01-01', '2026-12-31')).toBe(
      '2026.01.01 ~ 2026.12.31'
    )
  })
})

describe('resolveActivityCertificatePeriodHours', () => {
  it('BE 배포 전(필드 없음)·응답 없음 → 둘 다 -', () => {
    expect(resolveActivityCertificatePeriodHours(undefined)).toEqual({
      participationPeriod: '-',
      activityHours: '-',
    })
    expect(resolveActivityCertificatePeriodHours({ eligible: true })).toEqual({
      participationPeriod: '-',
      activityHours: '-',
    })
  })

  it('진행 완료 일정 없음(0, null) → 둘 다 -', () => {
    expect(
      resolveActivityCertificatePeriodHours({
        activityMinutes: 0,
        participationStartDate: null,
        participationEndDate: null,
      })
    ).toEqual({ participationPeriod: '-', activityHours: '-' })
  })

  it('서버 값 → 표시 문구', () => {
    expect(
      resolveActivityCertificatePeriodHours({
        activityMinutes: 330,
        participationStartDate: '2026-11-02',
        participationEndDate: '2026-11-09',
      })
    ).toEqual({ participationPeriod: '2026.11.02 ~ 2026.11.09', activityHours: '총 5시간 30분' })
  })
})
