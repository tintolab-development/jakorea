import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Program } from '@/types/domain'
import {
  getInstructorRecruitmentStatus,
  getParticipantRecruitmentStatus,
  getRecruitmentStatusFromDates,
  getRecruitmentStatusLabelForStatus,
  getVolunteerRecruitmentStatus,
} from './program-detail-info-constants'

const baseProgram = {
  id: 'program-status-test',
  sponsorId: 'sponsor-status-test',
  title: '모집 상태 테스트',
  type: 'offline',
  format: 'workshop',
  category: 'school',
  rounds: [],
  startDate: '2026-01-01',
  endDate: '2026-12-31',
  status: 'active',
} as unknown as Program

describe('모집 현황 상태', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('미래·현재·종료·누락 날짜를 구분한다', () => {
    expect(
      getRecruitmentStatusFromDates('2026-10-25', '2026-10-31', '2026-10-24')
    ).toBe('scheduled')
    expect(
      getRecruitmentStatusFromDates('2026-10-24', '2026-10-31', '2026-10-24')
    ).toBe('recruiting')
    expect(
      getRecruitmentStatusFromDates('2026-10-01', '2026-10-23', '2026-10-24')
    ).toBe('closed')
    expect(getRecruitmentStatusFromDates(undefined, '2026-10-31', '2026-10-24')).toBeNull()
  })

  it('UTC ISO 경계는 Asia/Seoul 달력일 기준으로 시작일·종료일을 포함한다', () => {
    const start = '2026-10-24T15:00:00.000Z' // 10월 25일 00:00 KST
    const end = '2026-10-25T14:59:59.999Z' // 10월 25일 23:59:59 KST

    expect(getRecruitmentStatusFromDates(start, end, '2026-10-24T14:59:59.999Z')).toBe(
      'scheduled'
    )
    expect(getRecruitmentStatusFromDates(start, end, start)).toBe('recruiting')
    expect(getRecruitmentStatusFromDates(start, end, '2026-10-25T15:00:00.000Z')).toBe('closed')
  })

  it('lifecycleStatus가 아니라 모집 유형별 기간을 사용한다', () => {
    // 참여자 기간(2026-10-24~31) 안의 시각으로 고정 — 오늘 날짜에 따라 결과가 바뀌지 않게 한다
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-27T03:00:00.000Z'))
    const program: Program = {
      ...baseProgram,
      lifecycleStatus: 'recruiting_students',
      applicationStartDate: '2099-01-01',
      applicationEndDate: '2099-01-31',
      instructorApplicationStartDate: '2026-01-01',
      instructorApplicationEndDate: '2026-01-02',
      volunteerApplicationStartDate: '2099-02-01',
      volunteerApplicationEndDate: '2099-02-28',
    }

    expect(
      getParticipantRecruitmentStatus(program, {
        applicationStartDate: '2026-10-24',
        applicationEndDate: '2026-10-31',
      })
    ).toBe('recruiting')
    expect(getInstructorRecruitmentStatus(program)).toBe('closed')
    expect(getVolunteerRecruitmentStatus(program)).toBe('scheduled')
  })

  it('모집 유형 라벨은 프로그램 lifecycle 라벨과 분리한다', () => {
    expect(getRecruitmentStatusLabelForStatus('scheduled', 'participant')).toBe(
      '참여자 모집 예정'
    )
    expect(getRecruitmentStatusLabelForStatus('recruiting', 'instructor')).toBe('강사 모집 중')
    expect(getRecruitmentStatusLabelForStatus('closed', 'volunteer')).toBe('봉사자 모집 마감')
    expect(getRecruitmentStatusLabelForStatus(null, 'participant')).toBe('-')
  })
})
