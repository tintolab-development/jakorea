import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'
import {
  getUjatInterview2NextStatusTransitionDelayMs,
  UJAT_INTERVIEW2_STATUS_POLL_MS,
  type UjatVolunteerInterview2ResultSelectRow,
} from './display'

const NOW = dayjs('2026-11-09T19:50:00+09:00')

function row(patch: Partial<UjatVolunteerInterview2ResultSelectRow>): UjatVolunteerInterview2ResultSelectRow {
  return {
    interviewAssignmentStatus: 'assigned',
    secondInterviewScreeningStatus: 'waiting',
    assignedInterviewDateLabel: undefined,
    assignedInterviewTime: undefined,
    assignedInterviewStartAt: '2026-11-09T19:30:00+09:00',
    assignedInterviewEndAt: '2026-11-09T20:00:00+09:00',
    managerAScore: null,
    managerBScore: null,
    ...patch,
  } as UjatVolunteerInterview2ResultSelectRow
}

describe('getUjatInterview2NextStatusTransitionDelayMs', () => {
  it('면접 종료 시각까지 남은 시간을 돌려준다', () => {
    const later = row({ assignedInterviewEndAt: '2026-11-09T19:50:30+09:00' })
    expect(getUjatInterview2NextStatusTransitionDelayMs([later], NOW)).toBe(30_000)
  })

  it('남은 시간이 주기보다 길면 주기로 자른다', () => {
    expect(getUjatInterview2NextStatusTransitionDelayMs([row({})], NOW)).toBe(
      UJAT_INTERVIEW2_STATUS_POLL_MS
    )
  })

  it('이미 끝났거나 합격·활동 포기면 전환 대상에서 뺀다', () => {
    const rows = [
      row({ assignedInterviewEndAt: '2026-11-09T19:40:00+09:00' }),
      row({ assignedInterviewEndAt: '2026-11-09T19:50:10+09:00', secondInterviewScreeningStatus: 'pass' }),
      row({ assignedInterviewEndAt: '2026-11-09T19:50:10+09:00', interviewAssignmentStatus: 'withdrawn' }),
    ]
    expect(getUjatInterview2NextStatusTransitionDelayMs(rows, NOW)).toBe(
      UJAT_INTERVIEW2_STATUS_POLL_MS
    )
  })

  it('최소 1초 간격을 지킨다', () => {
    const soon = row({ assignedInterviewEndAt: '2026-11-09T19:50:00.200+09:00' })
    expect(getUjatInterview2NextStatusTransitionDelayMs([soon], NOW)).toBe(1_000)
  })
})
