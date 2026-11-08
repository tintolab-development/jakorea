/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { mapSessionProgressToParticipatingSchoolSessions } from '@/features/program/general/api/adapters/general-applications-adapters'
import { ParticipatingProgressEducationScheduleCell } from './participating-progress-education-schedule-cell'
import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'
import type { SessionProgress } from '@/shared/api/generated/dashboard/schemas/sessionProgress'
import { formatParticipatingSchoolSessionLine } from './participating-school-session-display'
import { formatEducationRoundSessionLabel } from '@/shared/lib/education-schedule-name'

const LINE_SELECTOR = '.schedule-lines-cell__line'

/** 일정 줄은 디바이더로 쪼개 렌더 — 원문은 줄 title 로 확인 */
function findLineByTitle(title: string): Element | null {
  return document.querySelector(`${LINE_SELECTOR}[title="${title}"]`)
}

function session(overrides: Partial<ParticipatingSchoolSession> = {}): ParticipatingSchoolSession {
  return {
    round: 1,
    date: '2026.04.20',
    dayOfWeek: '월',
    duration: '60분',
    format: '-',
    classNum: '',
    timeRange: '09:30~12:20',
    resolvedScheduleId: 101,
    ...overrides,
  }
}

function progress(overrides: Partial<SessionProgress> = {}): SessionProgress {
  return {
    sessionNo: 1,
    scheduleId: 101,
    startAt: '2026-04-20T00:30:00Z',
    endAt: '2026-04-20T03:20:00Z',
    ...overrides,
  } as SessionProgress
}

describe('ParticipatingProgressEducationScheduleCell', () => {
  afterEach(() => {
    cleanup()
  })

  it('1. 사전교육 없음 + 본교육 1회차', () => {
    render(
      <ParticipatingProgressEducationScheduleCell
        sessions={[session({ sessionNo: 1, round: 1 })]}
      />
    )
    expect(findLineByTitle('2026.04.20(월) 09:30 ~ 12:20 | 1회차')).toBeTruthy()
    expect(screen.queryByText(/사전교육/)).toBeNull()
  })

  it('2. 사전교육 없음 + 본교육 2회차', () => {
    render(
      <ParticipatingProgressEducationScheduleCell
        sessions={[
          session({ sessionNo: 1, round: 1, resolvedScheduleId: 1 }),
          session({
            sessionNo: 2,
            round: 2,
            resolvedScheduleId: 2,
            date: '2026.04.27',
            timeRange: '13:30~15:20',
          }),
        ]}
      />
    )
    expect(findLineByTitle('2026.04.20(월) 09:30 ~ 12:20 | 1회차')).toBeTruthy()
    expect(findLineByTitle('2026.04.27(월) 13:30 ~ 15:20 | 2회차')).toBeTruthy()
    expect(screen.queryByText(/외 /)).toBeNull()
  })

  it('3. 사전교육 없음 + 본교육 5회차 — 최대 3줄: 앞 2건 + 외 3개', () => {
    const sessions = [1, 2, 3, 4, 5].map(n =>
      session({ sessionNo: n, round: n, resolvedScheduleId: n, date: `2026.04.2${n}` })
    )
    const { container } = render(
      <ParticipatingProgressEducationScheduleCell sessions={sessions} />
    )
    expect(container.textContent).toContain('1회차')
    expect(container.textContent).toContain('2회차')
    expect(container.textContent).not.toContain('5회차')
    expect(container.querySelectorAll(LINE_SELECTOR)).toHaveLength(2)
    expect(container.textContent).toContain('외 3개의 교육 일정')
  })

  it('4. 사전교육 있음 + 본교육 3회차', () => {
    const { container } = render(
      <ParticipatingProgressEducationScheduleCell
        sessions={[
          session({
            round: 0,
            sessionNo: null,
            resolvedScheduleId: 9,
            scheduleRole: 'PRE_EDUCATION',
            educationSlotKey: 'general-pre-education:1',
            date: '2026.04.13',
          }),
          session({ sessionNo: 1, round: 1, resolvedScheduleId: 1 }),
          session({ sessionNo: 2, round: 2, resolvedScheduleId: 2, date: '2026.04.21' }),
          session({ sessionNo: 3, round: 3, resolvedScheduleId: 3, date: '2026.04.28' }),
        ]}
      />
    )
    expect(container.textContent).toContain('사전교육')
    expect(container.textContent).toContain('1회차')
    expect(container.querySelectorAll(LINE_SELECTOR)).toHaveLength(2)
    expect(container.textContent).toContain('외 2개의 교육 일정')
  })

  it('5. 사전교육 있음 + 본교육 10회차', () => {
    const sessions = [
      session({
        round: 0,
        sessionNo: null,
        resolvedScheduleId: 0,
        scheduleRole: 'PRE_EDUCATION',
        educationSlotKey: 'general-pre-education:2',
      }),
      ...Array.from({ length: 10 }, (_, i) =>
        session({ sessionNo: i + 1, round: i + 1, resolvedScheduleId: i + 1 })
      ),
    ]
    const { container } = render(
      <ParticipatingProgressEducationScheduleCell sessions={sessions} />
    )
    expect(container.querySelectorAll(LINE_SELECTOR)).toHaveLength(2)
    expect(container.textContent).toContain('외 9개의 교육 일정')
  })

  it('6. 회차별 차시가 모두 다르다', () => {
    const shape = {
      educationStructure: 'curriculum' as const,
      sessionRound: 'multi' as const,
      curriculumSessions: [
        { sessionNo: 1, sessionLabel: '1회차', title: '2차시' },
        { sessionNo: 2, sessionLabel: '2회차', title: '3차시' },
        { sessionNo: 3, sessionLabel: '3회차', title: '1차시' },
      ],
    }
    render(
      <ParticipatingProgressEducationScheduleCell
        sessions={[
          session({ sessionNo: 1, round: 1 }),
          session({ sessionNo: 2, round: 2, date: '2026.04.21' }),
          session({ sessionNo: 3, round: 3, date: '2026.04.22' }),
        ]}
        shape={shape}
      />
    )
    expect(screen.getByText(/1회차 \(2차시\)/)).toBeTruthy()
    expect(screen.getByText(/2회차 \(3차시\)/)).toBeTruthy()
    expect(screen.getByText(/3회차 \(1차시\)/)).toBeTruthy()
  })

  it('7. 동일 날짜 복수 회차는 합치지 않는다', () => {
    const { container } = render(
      <ParticipatingProgressEducationScheduleCell
        sessions={[
          session({ sessionNo: 1, round: 1, timeRange: '09:30~12:20', resolvedScheduleId: 1 }),
          session({ sessionNo: 2, round: 2, timeRange: '13:30~15:20', resolvedScheduleId: 2 }),
        ]}
      />
    )
    expect(container.querySelectorAll(LINE_SELECTOR)).toHaveLength(
      2
    )
    expect(container.textContent).toContain('1회차')
    expect(container.textContent).toContain('2회차')
  })

  it('8. 회차 번호 1, 2, 4를 재채번하지 않는다', () => {
    render(
      <ParticipatingProgressEducationScheduleCell
        sessions={[
          session({ sessionNo: 1, round: 1, resolvedScheduleId: 1 }),
          session({ sessionNo: 2, round: 2, resolvedScheduleId: 2, date: '2026.04.21' }),
          session({ sessionNo: 4, round: 4, resolvedScheduleId: 4, date: '2026.04.28' }),
        ]}
      />
    )
    expect(screen.getByText(/4회차/)).toBeTruthy()
    expect(screen.queryByText(/3회차/)).toBeNull()
  })

  it('9. 본교육이 없고 사전교육만 존재', () => {
    render(
      <ParticipatingProgressEducationScheduleCell
        sessions={[
          session({
            round: 0,
            sessionNo: null,
            scheduleRole: 'PRE_EDUCATION',
            educationSlotKey: 'general-pre-education:1',
          }),
        ]}
      />
    )
    expect(screen.getByText(/사전교육/)).toBeTruthy()
    expect(screen.queryByText(/회차/)).toBeNull()
  })

  it('10. 전체 교육 일정 없음', () => {
    render(<ParticipatingProgressEducationScheduleCell sessions={[]} />)
    expect(screen.getByText('-')).toBeTruthy()
  })

  it('11. 사전교육과 본교육 시간 중첩도 별도 줄로 유지한다', () => {
    const { container } = render(
      <ParticipatingProgressEducationScheduleCell
        sessions={[
          session({
            round: 0,
            sessionNo: null,
            resolvedScheduleId: 9,
            scheduleRole: 'PRE_EDUCATION',
            educationSlotKey: 'general-pre-education:1',
            timeRange: '09:30~12:20',
          }),
          session({
            sessionNo: 1,
            round: 1,
            resolvedScheduleId: 1,
            timeRange: '09:30~12:20',
          }),
        ]}
      />
    )
    expect(container.querySelectorAll(LINE_SELECTOR)).toHaveLength(
      2
    )
  })

  it('12·13. 커리큘럼 없이 교육 일정만 있으면 회차만, 차시 없는 회차는 차시를 만들지 않는다', () => {
    render(
      <ParticipatingProgressEducationScheduleCell
        sessions={[session({ sessionNo: 2, round: 2, classNum: '2교시' })]}
      />
    )
    expect(findLineByTitle('2026.04.20(월) 09:30 ~ 12:20 | 2회차')).toBeTruthy()
    expect(screen.queryByText(/차시/)).toBeNull()
  })

  it('14. 회차와 차시가 모두 없으면 날짜와 시간만 표시한다', () => {
    render(
      <ParticipatingProgressEducationScheduleCell
        sessions={[session({ round: 0, sessionNo: null, classNum: '' })]}
      />
    )
    expect(screen.getByText('2026.04.20(월) 09:30 ~ 12:20')).toBeTruthy()
  })

  it('15. 참여자 셀은 회차·차시, 봉사자 줄은 같은 원본을 쓰되 강사 배정은 sessionNo 회차만 쓴다', () => {
    const row = session({ sessionNo: 3, round: 3, classNum: '3교시' })
    render(
      <ParticipatingProgressEducationScheduleCell
        sessions={[row]}
        shape={{
          educationStructure: 'curriculum',
          sessionRound: 'multi',
          curriculumSessions: [{ sessionNo: 3, sessionLabel: '3회차', title: '1차시' }],
        }}
      />
    )
    expect(screen.getByText(/3회차 \(1차시\)/)).toBeTruthy()
    expect(formatParticipatingSchoolSessionLine(row)).toContain('3회차')
    expect(formatParticipatingSchoolSessionLine(row)).not.toContain('3차시')
    expect(formatEducationRoundSessionLabel({ roundNumber: row.sessionNo })).toBe('3회차')
  })

  it('mapper 경로: sessionNo를 회차로 보존하고 교시·인덱스로 차시를 만들지 않는다', () => {
    const mapped = mapSessionProgressToParticipatingSchoolSessions([
      progress({
        sessionNo: 4,
        scheduleId: 44,
        scheduleName: '본교육',
      }),
      {
        ...progress({ sessionNo: undefined, scheduleId: 55, startAt: '2026-04-13T00:30:00Z' }),
        scheduleRole: 'PRE_EDUCATION',
        educationSlotKey: 'general-pre-education:1',
        scheduleName: '사전 교육',
      } as SessionProgress,
    ])
    const main = mapped.find(row => row.resolvedScheduleId === 44)
    const pre = mapped.find(row => row.resolvedScheduleId === 55)
    expect(mapped.map(row => row.classNum)).toEqual(['', ''])
    expect(main?.sessionNo).toBe(4)
    expect(main?.round).toBe(4)
    expect(pre?.scheduleRole).toBe('PRE_EDUCATION')
    const { container } = render(<ParticipatingProgressEducationScheduleCell sessions={mapped} />)
    expect(container.textContent).toContain('4회차')
    expect(container.textContent).toContain('사전교육')
    expect(container.textContent).not.toContain('교시')
  })
})
